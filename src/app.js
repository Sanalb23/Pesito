const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const gameRoutes = require("./routes/game.routes");
const matchRoutes = require("./routes/match.routes");
const notificationRoutes = require("./routes/notification.routes");
const friendRoutes = require("./routes/friend.routes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/games", gameRoutes);
app.use("/matches", matchRoutes);
app.use("/notifications", notificationRoutes);
app.use("/friends", friendRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port https://localhost:${PORT}`);
});