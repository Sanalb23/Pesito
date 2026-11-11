const teamModel = require('../models/team.model');

const getTeams = async (req, res) => {
    try {
        const { query, page } = req.query;

        const pageNumber = Math.max(1, parseInt(page) || 1);
        const limit = 15;
        const offset = (pageNumber - 1) * limit;

        const teams = await teamModel.searchTeamsByName(query, limit, offset);

        res.status(200).json({
            message: "Equipos obtenidos",
            data: teams
        });
    } catch (error) {
        res.status(500).json({ error: "GET_TEAMS_ERROR", message: "Error al obtener los equipos" });
    }
};

module.exports = {
    getTeams
};

