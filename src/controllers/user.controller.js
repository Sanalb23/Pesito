const { findByNickname } = require('../models/user.model');

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


module.exports = {
    searchByNickname
};