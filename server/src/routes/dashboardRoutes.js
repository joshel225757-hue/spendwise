
const express = require("express");

const Transaction = require("../models/Transaction");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all dashboard routes
router.use(protect);

// =====================================
// GET DASHBOARD SUMMARY
// GET /api/dashboard/summary
// =====================================

router.get("/summary", async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      }

      if (transaction.type === "expense") {
        totalExpenses += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpenses;

    return res.status(200).json({
      message: "Dashboard summary fetched successfully!",
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: transactions.length
      }
    });

  } catch (error) {
    console.error("Dashboard summary error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch dashboard summary"
    });
  }
});

module.exports = router;
