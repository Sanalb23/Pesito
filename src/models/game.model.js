const pool = require("../config/db")

const getGames = async () => {
    const query = 'SELECT * FROM games ORDER BY release_year DESC';
    const result = await pool.query(query);
    return result.rows;
}

module.exports = {
    getGames,
}