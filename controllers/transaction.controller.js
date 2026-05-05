const pool = require("../db");

// POST /transactions
const addTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, category_id, note, vendor, txn_date } = req.body;

    if (!amount || !txn_date) {
      return res.status(400).json({ error: "amount and txn_date are required" });
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(txn_date)) {
      return res.status(400).json({ error: "txn_date must be in YYYY-MM-DD format" });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, category_id, note, vendor, txn_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, amount, category_id || null, note || null, vendor || null, txn_date]
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

// GET /transactions
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, category_id, vendor } = req.query;

    let query = `
      SELECT t.*, c.name AS category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const values = [userId];
    let idx = 2;

    if (from) { query += ` AND t.txn_date >= $${idx++}`; values.push(from); }
    if (to)   { query += ` AND t.txn_date <= $${idx++}`; values.push(to); }
    if (category_id) { query += ` AND t.category_id = $${idx++}`; values.push(category_id); }
    if (vendor) { query += ` AND t.vendor ILIKE $${idx++}`; values.push(`%${vendor}%`); }

    query += ` ORDER BY t.txn_date DESC`;

    const result = await pool.query(query, values);
    res.json({ count: result.rows.length, transactions: result.rows });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// PUT /transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, category_id, note, vendor, txn_date } = req.body;

    const existing = await pool.query(
      "SELECT id FROM transactions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    if (txn_date && !/^\d{4}-\d{2}-\d{2}$/.test(txn_date)) {
      return res.status(400).json({ error: "txn_date must be in YYYY-MM-DD format" });
    }

    const result = await pool.query(
      `UPDATE transactions
       SET
         amount      = COALESCE($1, amount),
         category_id = COALESCE($2, category_id),
         note        = COALESCE($3, note),
         vendor      = COALESCE($4, vendor),
         txn_date    = COALESCE($5, txn_date)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [amount || null, category_id || null, note || null, vendor || null, txn_date || null, id, userId]
    );

    res.json({ message: "Transaction updated", transaction: result.rows[0] });
  } catch (err) {
    console.error("Update transaction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { addTransaction, getTransactions, updateTransaction, deleteTransaction };
