const express = require("express");
const {
    getGames,
    getLeaguesByGame,
    getTeamsByLeagueAndGame
} = require("../controllers/game.controller");

const router = express.Router();

router.get("/", getGames);

router.get("/:gameId/leagues", getLeaguesByGame);

router.get("/:gameId/leagues/:leagueId/teams", getTeamsByLeagueAndGame);

module.exports = router;
