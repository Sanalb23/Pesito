const gameModel = require('../models/game.model');
const leagueModel = require('../models/league.model');
const teamGameModel = require('../models/team.game.model');

const getGames = async (req, res) => {
    try {
        const games = await gameModel.getGames();
        res.status(200).json(games);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los juegos" });
    }
};

const getLeaguesByGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const leagues = await leagueModel.getLeaguesByGame(gameId);
        res.status(200).json(leagues);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las ligas" });
    }
};

const getTeamsByLeagueAndGame = async (req, res) => {
    try {
        const { gameId, leagueId } = req.params;
        const teams = await teamGameModel.getTeamsByLeagueAndGame(gameId, leagueId);
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los equipos" });
    }
};

module.exports = {
    getGames,
    getLeaguesByGame,
    getTeamsByLeagueAndGame
};
