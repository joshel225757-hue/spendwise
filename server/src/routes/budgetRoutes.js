
const express = require("express");
const mongoose = require("mongoose");

const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All budget endpoints require login
router.use(protect);

// Validate budget information
function validateBudget(body) {
  const { category, amount, month, year } = body;

  if (
    typeof category !== "string" ||
    !category.trim()
  ) {
    return "Category is required";
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return "Amount must be a positive number";
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return "Month must be between 1 and 12";
  }

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    return "Please provide a valid year";
  }

  return null;
}

// Calculate spending for a budget
async function getBudgetProgress(budget, userId) {
  const startDate = new Date(
    Date.UTC(budget.year, budget.month - 1, 1)
  );

  const endDate = new Date(
    Date.UTC(budget.year, budget.month, 1)
  );

  const transactions = await Transaction.find({
    user: userId,
    type: "expense",
    category: budget.category,
    date: {
      $gte: startDate,
      $lt: endDate
    }
  });

  const spent = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const remaining = budget.amount - spent;

  const percentageUsed =
    (spent / budget.amount) * 100;

  return {
    id: budget._id,
    category: budget.category,
    amount: budget.amount,
    month: budget.month,
    year: budget.year,
    spent: Number(spent.toFixed(2)),
    remaining: Number(remaining.toFixed(2)),
    percentageUsed: Number(percentageUsed.toFixed(2)),
    exceeded: spent > budget.amount
  };
}

// =====================================
// CREATE MONTHLY BUDGET
// POST /api/budgets
// =====================================

router.post("/", async (req, res) => {
  try {
    const error = validateBudget(req.body);

    if (error) {
      return res.status(400).json({
        message: error
      });
    }

    const { category, amount, month, year } = req.body;

    const budget = await Budget.create({
      user: req.user._id,
      category: category.trim(),
      amount,
      month,
      year
    });

    const progress = await getBudgetProgress(
      budget,
      req.user._id
    );

    return res.status(201).json({
      message: "Budget created successfully!",
      budget: progress
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A budget already exists for this category and month"
      });
    }

    console.error("Create budget error:", error.message);

    return res.status(500).json({
      message: "Failed to create budget"
    });
  }
});

// =====================================
// GET BUDGETS WITH SPENDING PROGRESS
// GET /api/budgets?month=10&year=2026
// =====================================

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    const month = req.query.month === undefined
      ? now.getUTCMonth() + 1
      : Number(req.query.month);

    const year = req.query.year === undefined
      ? now.getUTCFullYear()
      : Number(req.query.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Invalid month or year"
      });
    }

    const budgets = await Budget.find({
      user: req.user._id,
      month,
      year
    }).sort({ category: 1 });

    const results = await Promise.all(
      budgets.map((budget) =>
        getBudgetProgress(budget, req.user._id)
      )
    );

    return res.status(200).json({
      message: "Budgets fetched successfully!",
      count: results.length,
      budgets: results
    });

  } catch (error) {
    console.error("Get budgets error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch budgets"
    });
  }
});

// =====================================
// UPDATE BUDGET LIMIT
// PUT /api/budgets/:id
// =====================================

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid budget ID"
      });
    }

    const error = validateBudget(req.body);

    if (error) {
      return res.status(400).json({
        message: error
      });
    }

    const { category, amount, month, year } = req.body;

    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      {
        $set: {
          category: category.trim(),
          amount,
          month,
          year
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found"
      });
    }

    const progress = await getBudgetProgress(
      budget,
      req.user._id
    );

    return res.status(200).json({
      message: "Budget updated successfully!",
      budget: progress
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A budget already exists for this category and month"
      });
    }

    console.error("Update budget error:", error.message);

    return res.status(500).json({
      message: "Failed to update budget"
    });
  }
});

// =====================================
// DELETE BUDGET
// DELETE /api/budgets/:id
// =====================================

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid budget ID"
      });
    }

    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found"
      });
    }

    return res.status(200).json({
      message: "Budget deleted successfully!"
    });

  } catch (error) {
    console.error("Delete budget error:", error.message);

    return res.status(500).json({
      message: "Failed to delete budget"
    });
  }
});

module.exports = router;
