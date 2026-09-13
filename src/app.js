const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');

require('dotenv').config();

app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/auth.routes");

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port https://localhost:${PORT}`);
});