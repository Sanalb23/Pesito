const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');

require('dotenv').config();

app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const gameRoutes = require("./routes/game.routes");
const matchRoutes = require("./routes/match.routes");
const recognitionRoutes = require("./routes/recognition.routes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/games", gameRoutes);
app.use("/matches", matchRoutes);
app.use("/recognition", recognitionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port https://localhost:${PORT}`);
});