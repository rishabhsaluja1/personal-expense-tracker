const express = require("express");
const cors = require("cors");

const budgetRoutes = require("./routes/budget.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const transactionRoutes = require("./routes/transaction.routes");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const authenticate = require("./middleware/auth.middleware");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/auth", authRoutes);
app.use("/transactions", transactionRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/budgets", budgetRoutes);
app.use("/categories", categoryRoutes);

module.exports = app;
