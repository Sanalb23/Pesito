const express = require("express");
const { searchByNickname } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth");
const { getMatchesByUserId } = require("../controllers/match.controller");

const router = express.Router();

router.get("/search", verifyToken, searchByNickname);

router.get("/matches", verifyToken, getMatchesByUserId);

module.exports = router;