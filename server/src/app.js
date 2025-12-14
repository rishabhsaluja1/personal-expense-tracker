const express = require("express");
const cors = require("cors");

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


app.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

module.exports = app;
