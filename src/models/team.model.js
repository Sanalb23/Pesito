const pool = require("../config/db");

const searchTeamsByName = async (search, limit = 15, offset = 0) => {
    if (search && search.trim() !== '') {
        const query = 'SELECT id, name, logo_url FROM teams WHERE name ILIKE $1 ORDER BY name ASC, id ASC LIMIT $2 OFFSET $3';
        const result = await pool.query(query, ['%' + search.trim() + '%', limit, offset]);
        return result.rows;
    }
    const query = 'SELECT id, name, logo_url FROM teams ORDER BY name ASC, id ASC LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
};

const findTeamById = async (id) => {
    const query = 'SELECT id, name, logo_url FROM teams WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    searchTeamsByName,
    findTeamById
};

