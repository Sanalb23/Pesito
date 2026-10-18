const { findByNickname, findById, getStatsByUserId } = require('../models/user.model');
const { parseId } = require('../utils/validators');

const searchByNickname = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(400).json({ error: "MISSING_SEARCH_QUERY", message: 'Debes ingresar un termino de busqueda' });
        }
        const user = await findByNickname(query);
        if (!user) {
            return res.status(404).json({ error: "USER_NOT_FOUND", message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: "Usuarios encontrados", data: user });
    } catch (error) {
        res.status(500).json({ error: "SEARCH_USER_ERROR", message: error.message });
    }
};

const getMyStats = async (req, res) => {
    try {
        const userId = parseId(req.user.id);

        if (!userId) {
            return res.status(400).json({ error: "INVALID_USER_ID", message: "Usuario no valido" });
        }

        const user = await findById(userId);
        if (!user) {
            return res.status(404).json({ error: "USER_NOT_FOUND", message: "Usuario no encontrado" });
        }

        const stats = await getStatsByUserId(userId);

        res.status(200).json({
            message: "Estadísticas del usuario obtenidas",
            data: {
                user,
                stats
            }
        });
    } catch (error) {
        console.error('GET_MY_STATS_ERROR:', error);
        res.status(500).json({ error: "GET_MY_STATS_ERROR", message: "Error al obtener las estadísticas del usuario" });
    }
};

const getUserStats = async (req, res) => {
    try {
        const userId = parseId(req.params.userId);

        if (!userId) {
            return res.status(400).json({ error: "INVALID_USER_ID", message: "Usuario no valido" });
        }

        const user = await findById(userId);
        if (!user) {
            return res.status(404).json({ error: "USER_NOT_FOUND", message: "Usuario no encontrado" });
        }

        const stats = await getStatsByUserId(userId);

        res.status(200).json({
            message: "Estadísticas del usuario obtenidas",
            data: {
                user,
                stats
            }
        });
    } catch (error) {
        console.error('GET_USER_STATS_ERROR:', error);
        res.status(500).json({ error: "GET_USER_STATS_ERROR", message: "Error al obtener las estadísticas del usuario" });
    }
};

module.exports = {
    searchByNickname,
    getMyStats,
    getUserStats
};