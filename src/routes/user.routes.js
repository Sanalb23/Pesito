const express = require("express");
const { searchByNickname } = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.get("/search", verifyToken, searchByNickname);

module.exports = router;