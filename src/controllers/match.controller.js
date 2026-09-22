const matchModel = require('../models/match.model');

const create = async (req, res) => {
    try {
        const matchData = req.body;

        if (!matchData.homeUserId && !matchData.awayUserId) {
            return res.status(400).json({ error: "Debes especificar al menos un jugador registrado" });
        }

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

const editMatch = async (req, res) => {
    try {
        const matchId = Number(req.params.matchId);
        const matchData = req.body;

        if (isNaN(matchId) || matchId <= 0) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (req.user.id !== match.home_user_id && req.user.id !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para editar este partido" });
        }

        const updatedMatch = await matchModel.editMatch(matchId, matchData);

        if (!updatedMatch) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        res.status(200).json({ message: "Partido editado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al editar el partido" });
    }
};

const deleteMatch = async (req, res) => {
    try {
        const matchId = Number(req.params.matchId);
        const userId = req.user.id;

        if (isNaN(matchId) || matchId <= 0) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (userId !== match.home_user_id && userId !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para eliminar este partido" });
        }

        const deletedMatch = await matchModel.deleteMatch(matchId);

        if (!deletedMatch) {
            return res.status(404).json({ error: "No se pudo eliminar el partido" });
        }

        res.status(200).json({ message: "Partido eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el partido" });
    }
};


module.exports = {
    create,
    getMyMatches,
    getMatchesByUserId,
    getMatchData,
    editMatch,
    deleteMatch
};
