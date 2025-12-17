const pool = require("../db");

// GET /analytics/monthly
const getMonthlySpending = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        TO_CHAR(txn_date, 'YYYY-MM') AS month,
        SUM(amount) AS total
      FROM transactions
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Monthly analytics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /analytics/categories
const getCategorySpending = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        COALESCE(c.name, 'Uncategorized') AS category,
        SUM(t.amount) AS total
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      GROUP BY category
      ORDER BY total DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Category analytics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /analytics/daily
const getDailySpending = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        txn_date AS date,
        SUM(amount) AS total
      FROM transactions
      WHERE user_id = $1
      GROUP BY txn_date
      ORDER BY txn_date
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Daily analytics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


// GET /analytics/budget-vs-actual
const getBudgetVsActual = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "month is required" });
    }

    // 1. Get budget
    const budgetResult = await pool.query(
      `
      SELECT total_budget
      FROM budgets
      WHERE user_id = $1 AND month = $2
      `,
      [userId, month]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ error: "Budget not set for this month" });
    }

    const budget = Number(budgetResult.rows[0].total_budget);

    // 2. Get actual spending for the month
    const actualResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS spent
      FROM transactions
      WHERE user_id = $1
        AND DATE_TRUNC('month', txn_date) = DATE_TRUNC('month', $2::date)
      `,
      [userId, month]
    );

    const spent = Number(actualResult.rows[0].spent);

    // 3. Compare
    if (spent > budget) {
      return res.json({
        month,
        budget,
        spent,
        overspent_by: spent - budget,
        status: "over_budget",
      });
    }

    res.json({
      month,
      budget,
      spent,
      remaining: budget - spent,
      status: "under_budget",
    });
  } catch (err) {
    console.error("Budget vs actual error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
// GET /analytics/category-overspend
const getCategoryOverspend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "month is required" });
    }

    const result = await pool.query(
      `
      SELECT
        c.name AS category,
        cb.budget_amount AS budget,
        SUM(t.amount) AS spent,
        SUM(t.amount) - cb.budget_amount AS overspent_by
      FROM category_budgets cb
      JOIN categories c ON cb.category_id = c.id
      JOIN transactions t ON t.category_id = c.id
      WHERE cb.user_id = $1
        AND cb.month = $2
        AND DATE_TRUNC('month', t.txn_date) = DATE_TRUNC('month', $2::date)
      GROUP BY c.name, cb.budget_amount
      HAVING SUM(t.amount) > cb.budget_amount
      ORDER BY overspent_by DESC
      `,
      [userId, month]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Category overspend error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /analytics/insights
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: "month is required" });
    }

    // Budget vs actual
    const budgetRes = await pool.query(
      `
      SELECT total_budget
      FROM budgets
      WHERE user_id = $1 AND month = $2
      `,
      [userId, month]
    );

    if (budgetRes.rows.length === 0) {
      return res.json({ message: "No budget set for this month." });
    }

    const budget = Number(budgetRes.rows[0].total_budget);

    const spentRes = await pool.query(
      `
      SELECT COALESCE(SUM(amount),0) AS spent
      FROM transactions
      WHERE user_id = $1
        AND DATE_TRUNC('month', txn_date) = DATE_TRUNC('month', $2::date)
      `,
      [userId, month]
    );

    const spent = Number(spentRes.rows[0].spent);

    // Top overspend category
    const categoryRes = await pool.query(
      `
      SELECT
        c.name,
        SUM(t.amount) AS spent
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND DATE_TRUNC('month', t.txn_date) = DATE_TRUNC('month', $2::date)
      GROUP BY c.name
      ORDER BY spent DESC
      LIMIT 1
      `,
      [userId, month]
    );

    const topCategory = categoryRes.rows[0];

    let response = {};

    if (spent > budget) {
      response.summary = `You overspent this month by ₹${spent - budget}.`;
      response.top_reason = topCategory
        ? `${topCategory.name} was your highest spending category.`
        : "A major category caused overspending.";
      response.suggestion =
        "Review discretionary expenses to stay within budget next month.";
    } else {
      response.summary = `You are within budget with ₹${budget - spent} remaining.`;
      response.suggestion =
        "Good job! Consider increasing savings or investments.";
    }

    res.json(response);
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /analytics/prediction
const getSpendingPrediction = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        DATE_TRUNC('month', txn_date) AS month,
        SUM(amount) AS total
      FROM transactions
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month DESC
      LIMIT 3
      `,
      [userId]
    );

    if (result.rows.length < 2) {
      return res.json({
        message: "Not enough data to make prediction",
      });
    }

    const totals = result.rows.map(r => Number(r.total));
    const avg =
      totals.reduce((a, b) => a + b, 0) / totals.length;

    res.json({
      method: "3-month moving average",
      predicted_next_month_spend: Math.round(avg),
    });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /analytics/savings-simulator
const savingsSimulator = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal_amount, months, monthly_income } = req.body;

    if (!goal_amount || !months || !monthly_income) {
      return res.status(400).json({
        error: "goal_amount, months, and monthly_income required",
      });
    }

    const result = await pool.query(
      `
      SELECT AVG(monthly_total) AS avg_spend
      FROM (
        SELECT SUM(amount) AS monthly_total
        FROM transactions
        WHERE user_id = $1
        GROUP BY DATE_TRUNC('month', txn_date)
      ) t
      `,
      [userId]
    );

    const avgSpend = Number(result.rows[0].avg_spend || 0);
    const requiredPerMonth = goal_amount / months;
    const possibleSavings = monthly_income - avgSpend;

    res.json({
      avg_monthly_spend: Math.round(avgSpend),
      required_savings_per_month: Math.round(requiredPerMonth),
      possible_savings_per_month: Math.round(possibleSavings),
      feasible: possibleSavings >= requiredPerMonth,
      suggestion:
        possibleSavings >= requiredPerMonth
          ? "Goal is achievable with current spending."
          : "Reduce expenses or increase income to reach this goal.",
    });
  } catch (err) {
    console.error("Savings simulator error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = { getMonthlySpending,
 getCategorySpending,
 getDailySpending,
 getBudgetVsActual,
 getCategoryOverspend,
 getInsights,
 getSpendingPrediction,
 savingsSimulator,
};

