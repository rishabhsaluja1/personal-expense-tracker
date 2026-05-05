const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transaction.controller");

const router = express.Router();

router.post("/", authenticate, addTransaction);
router.get("/", authenticate, getTransactions);
router.put("/:id", authenticate, updateTransaction);
router.delete("/:id", authenticate, deleteTransaction);

module.exports = router;
