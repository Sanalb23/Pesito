const express = require("express");
const { getTeams } = require("../controllers/team.controller");

const router = express.Router();

router.get("/", getTeams);

module.exports = router;

