const express = require("express");
const { searchByNickname, getMyStats, getUserStats } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth");
const {
    getMyMatches,
    getMatchesByUserId
} = require("../controllers/match.controller");

const router = express.Router();

router.get("/search", verifyToken, searchByNickname);

router.get("/me/matches", verifyToken, getMyMatches);
router.get("/me/stats", verifyToken, getMyStats);

router.get("/:userId/matches", verifyToken, getMatchesByUserId);
router.get("/:userId/stats", verifyToken, getUserStats);

module.exports = router;