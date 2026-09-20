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

module.exports = {
    create
};