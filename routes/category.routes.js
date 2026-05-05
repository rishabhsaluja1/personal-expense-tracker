const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const { getCategories, createCategory, deleteCategory } = require("../controllers/category.controller");

const router = express.Router();

router.get("/", authenticate, getCategories);
router.post("/", authenticate, createCategory);
router.delete("/:id", authenticate, deleteCategory);

module.exports = router;
