
const express = require("express");
const mongoose = require("mongoose");

const Transaction = require("../models/Transaction");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All transaction routes require login
router.use(protect);

// Validate transaction information
function validateTransaction(body) {
  const { type, amount, category, description, date } = body;

  if (!["income", "expense"].includes(type)) {
    return "Type must be income or expense";
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return "Amount must be a positive number";
  }

  if (typeof category !== "string" || !category.trim()) {
    return "Category is required";
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return "Description must be text";
  }

  if (
    date !== undefined &&
    (typeof date !== "string" ||
      !date.trim() ||
      Number.isNaN(new Date(date).getTime()))
  ) {
    return "Please provide a valid date";
  }

  return null;
}

// =====================================
// ADD TRANSACTION
// POST /api/transactions
// =====================================
router.post("/", async (req, res) => {
  try {
    const error = validateTransaction(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const {
      type,
      amount,
      category,
      description,
      date
    } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category: category.trim(),
      description: description?.trim() || "",
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({
      message: "Transaction added successfully!",
      transaction
    });
  } catch (error) {
    console.error("Add transaction error:", error.message);

    return res.status(500).json({
      message: "Failed to add transaction"
    });
  }
});

// =====================================
// GET ALL USER TRANSACTIONS
// GET /api/transactions
// =====================================
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id
    }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      message: "Transactions fetched successfully!",
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch transactions"
    });
  }
});

// =====================================
// GET SINGLE TRANSACTION
// GET /api/transactions/:id
// =====================================
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID"
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    return res.status(200).json({ transaction });
  } catch (error) {
    console.error("Get transaction error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch transaction"
    });
  }
});

// =====================================
// UPDATE TRANSACTION
// PUT /api/transactions/:id
// =====================================
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID"
      });
    }

    const error = validateTransaction(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const {
      type,
      amount,
      category,
      description,
      date
    } = req.body;

    const updates = {
      type,
      amount,
      category: category.trim(),
      description: description?.trim() || ""
    };

    if (date !== undefined) {
      updates.date = new Date(date);
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    return res.status(200).json({
      message: "Transaction updated successfully!",
      transaction
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);

    return res.status(500).json({
      message: "Failed to update transaction"
    });
  }
});

// =====================================
// DELETE TRANSACTION
// DELETE /api/transactions/:id
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid transaction ID"
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    return res.status(200).json({
      message: "Transaction deleted successfully!"
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);

    return res.status(500).json({
      message: "Failed to delete transaction"
    });
  }
});

module.exports = router;
