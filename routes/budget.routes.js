const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const {
  setBudget,
  getBudget,
} = require("../controllers/budget.controller");

const router = express.Router();

router.post("/", authenticate, setBudget);
router.get("/", authenticate, getBudget);

module.exports = router;
