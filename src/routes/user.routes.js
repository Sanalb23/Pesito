const express = require("express");
const {
    searchByNickname,
    getMyStats,
    getUserStats,
    getCurrentUser,
    getUserById,
    deleteAccount
} = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth");
const {
    getMyMatches,
    getMatchesByUserId
} = require("../controllers/match.controller");

const router = express.Router();

router.get("/search", verifyToken, searchByNickname);

router.get("/me", verifyToken, getCurrentUser);
router.delete("/me", verifyToken, deleteAccount);
router.get("/me/matches", verifyToken, getMyMatches);
router.get("/me/stats", verifyToken, getMyStats);

router.get("/:userId", verifyToken, getUserById);
router.get("/:userId/matches", verifyToken, getMatchesByUserId);
router.get("/:userId/stats", verifyToken, getUserStats);

module.exports = router;