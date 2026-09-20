const matchModel = require('../models/match.model');

const create = async (req, res) => {
    try {
        const matchData = req.body;
        const newMatch = await matchModel.create(matchData);
        res.status(201).json(newMatch);
    } catch (error) {
        res.status(500).json({ error: "Error al crear el partido" });
    }
};

const getMyMatches = async (req, res) => {
    try {
        const userId = req.user.id;
        const matches = await matchModel.getMatchesByUserId(userId);
        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los partidos" });
    }
};

const getMatchesByUserId = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: "Usuario no valido" });
        }

        const matches = await matchModel.getMatchesByUserId(userId);
        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los partidos" });
    }
};

const getMatchData = async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const match = await matchModel.getMatchData(matchId);

        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        res.status(200).json(match);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el partido" });
    }
};

module.exports = {
    create,
    getMyMatches,
    getMatchesByUserId,
    getMatchData
};
