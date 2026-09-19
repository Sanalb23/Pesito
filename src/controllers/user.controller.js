const { findByNickname } = require('../models/user.model');

const searchByNickname = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Debes ingresar un termino de busqueda' });
        }
        const user = await findByNickname(query);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    searchByNickname
};