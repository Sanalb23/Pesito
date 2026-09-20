const express = require("express");
const { create } = require("../controllers/match.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/", verifyToken, create);

module.exports = router;

