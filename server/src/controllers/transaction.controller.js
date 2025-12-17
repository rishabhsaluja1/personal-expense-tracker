const pool = require("../db");

// POST /transactions
const addTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, category_id, note, vendor, txn_date } = req.body;

    // basic validation
    if (!amount || !txn_date) {
      return res.status(400).json({
        error: "amount and txn_date are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO transactions
      (user_id, amount, category_id, note, vendor, txn_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        userId,
        amount,
        category_id || null,
        note || null,
        vendor || null,
        txn_date,
      ]
    );

    res.status(201).json({
      message: "Transaction added",
      transaction: result.rows[0],
    });
  } catch (err) {
    console.error("Add transaction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /transactions (with filters)
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, category_id, vendor } = req.query;

    let query = `
      SELECT *
      FROM transactions
      WHERE user_id = $1
    `;
    const values = [userId];
    let idx = 2;

    if (from) {
      query += ` AND txn_date >= $${idx++}`;
      values.push(from);
    }

    if (to) {
      query += ` AND txn_date <= $${idx++}`;
      values.push(to);
    }

    if (category_id) {
      query += ` AND category_id = $${idx++}`;
      values.push(category_id);
    }

    if (vendor) {
      query += ` AND vendor ILIKE $${idx++}`;
      values.push(`%${vendor}%`);
    }

    query += ` ORDER BY txn_date DESC`;

    const result = await pool.query(query, values);

    res.json({
      count: result.rows.length,
      transactions: result.rows,
    });
  } catch (err) {
    console.error("Filtered transactions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { addTransaction, getTransactions };
