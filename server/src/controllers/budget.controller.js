const pool = require("../db");

// POST /budgets
const setBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, total_budget } = req.body;

    if (!month || !total_budget) {
      return res.status(400).json({
        error: "month and total_budget are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO budgets (user_id, month, total_budget)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, month)
      DO UPDATE SET total_budget = EXCLUDED.total_budget
      RETURNING *
      `,
      [userId, month, total_budget]
    );

    res.json({
      message: "Budget saved",
      budget: result.rows[0],
    });
  } catch (err) {
    console.error("Set budget error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /budgets
const getBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "month is required" });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM budgets
      WHERE user_id = $1 AND month = $2
      `,
      [userId, month]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("Get budget error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { setBudget, getBudget };
