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

const getMatchesByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const matches = await matchModel.getMatchesByUserId(userId);
        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los partidos" });
    }
};

module.exports = {
    create,
    getMatchesByUserId
};
