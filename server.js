require("dotenv").config();
const app = require("./app");
console.log("DB URL FROM NODE:", process.env.DATABASE_URL);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
