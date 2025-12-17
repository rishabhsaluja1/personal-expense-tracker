const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const {
  getMonthlySpending,
  getCategorySpending,
  getDailySpending,
  getBudgetVsActual,
  getCategoryOverspend,
  getInsights,
  getSpendingPrediction,
  savingsSimulator,
} = require("../controllers/analytics.controller");

const router = express.Router();

router.get("/monthly", authenticate, getMonthlySpending);
router.get("/categories", authenticate, getCategorySpending);
router.get("/daily", authenticate, getDailySpending);
router.get("/budget-vs-actual", authenticate, getBudgetVsActual);
router.get("/category-overspend", authenticate, getCategoryOverspend);
router.get("/insights", authenticate, getInsights);
router.get("/prediction", authenticate, getSpendingPrediction);
router.post("/savings-simulator", authenticate, savingsSimulator);


module.exports = router;

