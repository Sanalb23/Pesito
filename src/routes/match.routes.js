const express = require("express");
const { create, getMatchData } = require("../controllers/match.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/", verifyToken, create);

router.get("/:matchId", verifyToken, getMatchData);

module.exports = router;

