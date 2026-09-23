const pool = require("../config/db");

const getTeamsByLeagueAndGame = async (gameId, leagueId) => {
    const query = `
        SELECT tg.id, t.name
        FROM teams t
        INNER JOIN teams_games tg
        ON t.id = tg.team_id
        WHERE game_id = $1 AND league_id = $2
        ORDER BY name ASC`;

    const result = await pool.query(query, [gameId, leagueId]);
    return result.rows;
};

const findTeamByNameAndGame = async (gameId, teamName) => {
    const query = `
        SELECT tg.id, t.name
        FROM teams t
        INNER JOIN teams_games tg
        ON t.id = tg.team_id
        WHERE game_id = $1
        ORDER BY SIMILARITY(t.name, $2) DESC
        LIMIT 1`;

    const result = await pool.query(query, [gameId, teamName]);
    return result.rows[0];
};

module.exports = {
    getTeamsByLeagueAndGame,
    findTeamByNameAndGame
};
