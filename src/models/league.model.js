const pool = require("../config/db")

const getLeaguesByGame = async (gameId) => {
    const query = `
    SELECT DISTINCT lg.id, lg.name
    FROM teams_games tg
    INNER JOIN leagues lg ON lg.id = tg.league_id
    WHERE game_id = $1
    ORDER BY lg.name ASC`;

    const result = await pool.query(query, [gameId]);
    return result.rows;
}

module.exports = {
    getLeaguesByGame,
}