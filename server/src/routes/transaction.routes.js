const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const { addTransaction, getTransactions } = require("../controllers/transaction.controller");

const router = express.Router();

// protected: add expense
router.post("/", authenticate, addTransaction);

// protected: get expense
router.get("/", authenticate, getTransactions);

module.exports = router;
