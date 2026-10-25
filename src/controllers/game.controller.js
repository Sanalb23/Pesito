const gameModel = require('../models/game.model');
const leagueModel = require('../models/league.model');
const teamGameModel = require('../models/team.game.model');
const { parseId } = require('../utils/validators');

const getGames = async (req, res) => {
    try {
        const games = await gameModel.getGames();
        res.status(200).json({ message: "Juegos obtenidos", data: games });
    } catch (error) {
        res.status(500).json({ error: "GET_GAMES_ERROR", message: "Error al obtener los juegos" });
    }
};

const getLeaguesByGame = async (req, res) => {
    try {
        const gameId = parseId(req.params.gameId);

        if (!gameId) {
            return res.status(400).json({ error: "INVALID_GAME_ID", message: "Juego no valido" });
        }

        const leagues = await leagueModel.getLeaguesByGame(gameId);
        res.status(200).json({ message: "Ligas obtenidas", data: leagues });
    } catch (error) {
        res.status(500).json({ error: "GET_LEAGUES_ERROR", message: "Error al obtener las ligas" });
    }
};

const getTeamsByLeagueAndGame = async (req, res) => {
    try {
        const gameId = parseId(req.params.gameId);
        const leagueId = parseId(req.params.leagueId);

        if (!gameId || !leagueId) {
            return res.status(400).json({ error: "INVALID_GAME_OR_LEAGUE_ID", message: "Juego o liga no valida" });
        }

        const teams = await teamGameModel.getTeamsByLeagueAndGame(gameId, leagueId);
        res.status(200).json({ message: "Equipos obtenidos", data: teams });
    } catch (error) {
        res.status(500).json({ error: "GET_TEAMS_ERROR", message: "Error al obtener los equipos" });
    }
};

module.exports = {
    getGames,
    getLeaguesByGame,
    getTeamsByLeagueAndGame
};
