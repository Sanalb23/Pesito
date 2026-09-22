const express = require("express");
const { create, getMatchData, editMatch, deleteMatch } = require("../controllers/match.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/", verifyToken, create);

router.get("/:matchId", verifyToken, getMatchData);

router.put("/:matchId", verifyToken, editMatch);

router.delete("/:matchId", verifyToken, deleteMatch);

module.exports = router;

