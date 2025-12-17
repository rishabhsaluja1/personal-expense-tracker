const express = require("express");
const cors = require("cors");

const budgetRoutes = require("./routes/budget.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const transactionRoutes = require("./routes/transaction.routes");
const authRoutes = require("./routes/auth.routes");
const authenticate = require("./middleware/auth.middleware");


const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("API is running...");
});

app.use("/auth",authRoutes);
app.use("/transactions", transactionRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/budgets", budgetRoutes);


app.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

module.exports = app;
