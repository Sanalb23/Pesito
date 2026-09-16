const express = require("express");
const { register, login, verifyUser } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/verify", verifyUser);

module.exports = router;