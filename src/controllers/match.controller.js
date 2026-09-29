const matchModel = require('../models/match.model');
const userModel = require('../models/user.model');
const { parseId } = require('../utils/validators');
const matchService = require('../services/match.service');

const requestCreate = async (req, res) => {
    try {
        const matchData = req.body;

        if (!matchData.homeUserId && !matchData.awayUserId) {
            return res.status(400).json({ error: "Debes especificar al menos un jugador registrado" });
        }

        const homeUserId = parseId(matchData.homeUserId);
        const awayUserId = parseId(matchData.awayUserId);

        if (homeUserId && awayUserId && homeUserId === awayUserId) {
            return res.status(400).json({ error: "No puedes enviarte una solicitud de partido a ti mismo" });
        }

        const homeUserPromise = homeUserId ? userModel.findById(homeUserId) : null;
        const awayUserPromise = awayUserId ? userModel.findById(awayUserId) : null;

        const [homeUser, awayUser] = await Promise.all([homeUserPromise, awayUserPromise]);

        if (matchData.homeUserId && !homeUser) {
            return res.status(404).json({ error: "Jugador local no encontrado" });
        }

        if (matchData.awayUserId && !awayUser) {
            return res.status(404).json({ error: "Jugador visitante no encontrado" });
        }

        const senderId = parseId(req.user?.id);
        const newMatch = await matchService.requestCreate(matchData, senderId);
        res.status(201).json(newMatch);
    } catch (error) {

        if (error.code === '23514') {
            if (error.constraint === 'chk_ids_distinct') {
                return res.status(400).json({ message: "No puedes enviarte una solicitud de partido a ti mismo" });
            }
        }

        res.status(500).json({ error: "Error al crear el partido" });
    }
};

const getMatchesByUserId = async (req, res) => {
    try {
        const userId = parseId(req.params.userId);

        if (!userId) {
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
        const matchId = parseId(req.params.matchId);

        if (!matchId) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);

        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        res.status(200).json(match);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el partido" });
    }
};

const requestEdit = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const senderId = parseId(req.body.senderId);
        const matchId = parseId(req.params.matchId);
        const { updatedMatchData } = req.body;

        if (!matchId) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (userId !== match.home_user_id && userId !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para solicitar la edición de este partido" });
        }

        const receiverId = senderId || (userId === match.home_user_id ? match.away_user_id : match.home_user_id);

        await matchService.requestEdit(matchId, userId, receiverId, updatedMatchData);

        res.status(200).json({ message: "Solicitud de edición enviada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al solicitar la edición del partido" });
    }
};

const requestDelete = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const senderId = parseId(req.body.senderId);
        const matchId = parseId(req.params.matchId);

        if (!matchId) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (userId !== match.home_user_id && userId !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para solicitar la eliminación de este partido" });
        }

        const receiverId = senderId || (userId === match.home_user_id ? match.away_user_id : match.home_user_id);

        await matchService.requestDelete(matchId, userId, receiverId);

        res.status(200).json({ message: "Solicitud de eliminación enviada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al solicitar la eliminación del partido" });
    }
};

const confirmMatch = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const senderId = parseId(req.body.senderId);
        const matchId = parseId(req.params.matchId);

        if (!matchId) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (userId !== match.home_user_id && userId !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para activar este partido" });
        }

        const receiverId = senderId || (userId === match.home_user_id ? match.away_user_id : match.home_user_id);

        const updatedMatch = await matchService.confirmCreate(matchId, userId, receiverId);

        if (!updatedMatch) {
            return res.status(404).json({ error: "No se pudo confirmar el partido" });
        }

        res.status(200).json({ message: "Partido confirmado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al confirmar el partido" });
    }
};

const confirmEdit = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const senderId = parseId(req.body.senderId);
        const matchId = parseId(req.params.matchId);
        const { updatedMatchData } = req.body;

        if (!matchId) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (userId !== match.home_user_id && userId !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para editar este partido" });
        }

        const receiverId = senderId;

        const updatedMatch = await matchService.confirmEdit(matchId, userId, receiverId, updatedMatchData);

        if (!updatedMatch) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        res.status(200).json({ message: "Partido editado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al editar el partido" });
    }
};

const confirmDelete = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const senderId = parseId(req.body.senderId);
        const matchId = parseId(req.params.matchId);

        if (!matchId) {
            return res.status(400).json({ error: "Partido no valido" });
        }

        const match = await matchModel.getMatchData(matchId);
        if (!match) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        if (userId !== match.home_user_id && userId !== match.away_user_id) {
            return res.status(403).json({ error: "No tienes permiso para eliminar este partido" });
        }

        const receiverId = senderId || (userId === match.home_user_id ? match.away_user_id : match.home_user_id);

        const deletedMatch = await matchService.confirmDelete(matchId, userId, receiverId);

        if (!deletedMatch) {
            return res.status(404).json({ error: "No se pudo eliminar el partido" });
        }

        res.status(200).json({ message: "Partido eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el partido" });
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

module.exports = {
    requestCreate,
    getMyMatches,
    getMatchesByUserId,
    getMatchData,
    requestEdit,
    requestDelete,
    confirmMatch,
    confirmEdit,
    confirmDelete,
};
