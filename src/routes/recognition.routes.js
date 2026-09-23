const express = require("express");
const { resolveMatchData } = require("../controllers/recognition.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/resolve", verifyToken, resolveMatchData);

module.exports = router;
