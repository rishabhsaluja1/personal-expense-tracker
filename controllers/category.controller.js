const pool = require("../db");

// GET /categories
// Returns global (seeded) categories + any custom ones created by this user
const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY user_id NULLS FIRST, name ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /categories  — user adds a custom category
const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check duplicate for this user (or global)
    const duplicate = await pool.query(
      `SELECT id FROM categories
       WHERE LOWER(name) = LOWER($1) AND (user_id IS NULL OR user_id = $2)`,
      [name.trim(), userId]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: "Category already exists" });
    }

    const result = await pool.query(
      "INSERT INTO categories (name, user_id) VALUES ($1, $2) RETURNING *",
      [name.trim(), userId]
    );

    res.status(201).json({ message: "Category created", category: result.rows[0] });
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /categories/:id  — user can only delete their own custom categories
const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found or cannot delete a default category" });
    }

    res.json({ message: "Category deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
