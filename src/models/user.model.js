const pool = require("../config/db")

const findByEmail = async (email) => {
    const query = 'SELECT id, nickname, email, password FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

const create = async (nickname, email, hashedPassword) => {
    const query = 'INSERT INTO users (nickname, email, password) VALUES ($1, $2, $3) RETURNING id, nickname, email';
    const result = await pool.query(query, [nickname, email, hashedPassword]);
    return result.rows[0];
};

const findByNickname = async (nickname) => {
    const query = 'SELECT id, nickname FROM users WHERE nickname ILIKE $1';
    const result = await pool.query(query, ['%' + nickname + '%']);
    return result.rows;
};

const findById = async (id) => {
    const query = 'SELECT id, nickname, email, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const getStatsByUserId = async (userId) => {
    const query = `
        WITH user_matches AS (
            SELECT
                m.id,
                m.home_goals AS user_goals,
                m.away_goals AS opponent_goals,
                ms.home_possession AS possession,
                ms.home_shots AS shots,
                ms.home_shots_on_target AS shots_on_target,
                ms.home_penalties AS penalties,
                ms.home_free_kicks AS free_kicks,
                ms.home_corner_kicks AS corner_kicks,
                ms.home_offsides AS offsides,
                ms.home_fouls AS fouls,
                ms.home_yellow_cards AS yellow_cards,
                ms.home_red_cards AS red_cards,
                ms.away_possession AS opponent_possession,
                ms.away_shots AS opponent_shots,
                ms.away_shots_on_target AS opponent_shots_on_target,
                ms.away_penalties AS opponent_penalties,
                ms.away_free_kicks AS opponent_free_kicks,
                ms.away_corner_kicks AS opponent_corner_kicks,
                ms.away_offsides AS opponent_offsides,
                ms.away_fouls AS opponent_fouls,
                ms.away_yellow_cards AS opponent_yellow_cards,
                ms.away_red_cards AS opponent_red_cards
            FROM matches m
            LEFT JOIN match_stats ms ON ms.match_id = m.id
            WHERE m.home_user_id = $1
            AND m.active = true

            UNION ALL

            SELECT
                m.id,
                m.away_goals AS user_goals,
                m.home_goals AS opponent_goals,
                ms.away_possession AS possession,
                ms.away_shots AS shots,
                ms.away_shots_on_target AS shots_on_target,
                ms.away_penalties AS penalties,
                ms.away_free_kicks AS free_kicks,
                ms.away_corner_kicks AS corner_kicks,
                ms.away_offsides AS offsides,
                ms.away_fouls AS fouls,
                ms.away_yellow_cards AS yellow_cards,
                ms.away_red_cards AS red_cards,
                ms.home_possession AS opponent_possession,
                ms.home_shots AS opponent_shots,
                ms.home_shots_on_target AS opponent_shots_on_target,
                ms.home_penalties AS opponent_penalties,
                ms.home_free_kicks AS opponent_free_kicks,
                ms.home_corner_kicks AS opponent_corner_kicks,
                ms.home_offsides AS opponent_offsides,
                ms.home_fouls AS opponent_fouls,
                ms.home_yellow_cards AS opponent_yellow_cards,
                ms.home_red_cards AS opponent_red_cards
            FROM matches m
            LEFT JOIN match_stats ms ON ms.match_id = m.id
            WHERE m.away_user_id = $1
            AND m.active = true
        )
        SELECT
            COUNT(*)::int AS matches_played,
            COUNT(*) FILTER (WHERE user_goals > opponent_goals)::int AS wins,
            COUNT(*) FILTER (WHERE user_goals = opponent_goals)::int AS draws,
            COUNT(*) FILTER (WHERE user_goals < opponent_goals)::int AS losses,
            COALESCE(SUM(user_goals), 0)::int AS goals_for,
            COALESCE(SUM(opponent_goals), 0)::int AS goals_against,
            COALESCE(SUM(user_goals - opponent_goals), 0)::int AS goal_difference,
            COALESCE(ROUND(AVG(user_goals)::numeric, 2), 0) AS average_goals_for,
            COALESCE(ROUND(AVG(opponent_goals)::numeric, 2), 0) AS average_goals_against,
            COALESCE(ROUND((COUNT(*) FILTER (WHERE user_goals > opponent_goals)::numeric * 100 / NULLIF(COUNT(*), 0)), 2), 0) AS win_rate,

            COALESCE(ROUND(AVG(possession)::numeric, 2), 0) AS possession_average,
            COALESCE(SUM(shots), 0)::int AS shots,
            COALESCE(SUM(shots_on_target), 0)::int AS shots_on_target,
            COALESCE(SUM(penalties), 0)::int AS penalties,
            COALESCE(SUM(free_kicks), 0)::int AS free_kicks,
            COALESCE(SUM(corner_kicks), 0)::int AS corner_kicks,
            COALESCE(SUM(offsides), 0)::int AS offsides,
            COALESCE(SUM(fouls), 0)::int AS fouls,
            COALESCE(SUM(yellow_cards), 0)::int AS yellow_cards,
            COALESCE(SUM(red_cards), 0)::int AS red_cards,

            COALESCE(ROUND(AVG(opponent_possession)::numeric, 2), 0) AS opponent_possession_average,
            COALESCE(SUM(opponent_shots), 0)::int AS opponent_shots,
            COALESCE(SUM(opponent_shots_on_target), 0)::int AS opponent_shots_on_target,
            COALESCE(SUM(opponent_penalties), 0)::int AS opponent_penalties,
            COALESCE(SUM(opponent_free_kicks), 0)::int AS opponent_free_kicks,
            COALESCE(SUM(opponent_corner_kicks), 0)::int AS opponent_corner_kicks,
            COALESCE(SUM(opponent_offsides), 0)::int AS opponent_offsides,
            COALESCE(SUM(opponent_fouls), 0)::int AS opponent_fouls,
            COALESCE(SUM(opponent_yellow_cards), 0)::int AS opponent_yellow_cards,
            COALESCE(SUM(opponent_red_cards), 0)::int AS opponent_red_cards
        FROM user_matches;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

const deleteUser = async (id) => {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
};

const findPasswordById = async (id) => {
    const query = 'SELECT id, password FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateUserData = async (id, fields = {}) => {
    const setClauses = [];
    const values = [];
    let index = 1;

    const allowedColumns = ['nickname', 'email', 'password'];

    for (const column of allowedColumns) {
        if (fields[column] !== undefined && fields[column] !== null) {
            setClauses.push(`${column} = $${index++}`);
            values.push(fields[column]);
        }
    }

    if (setClauses.length === 0) return;

    values.push(id);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${index}`;
    await pool.query(query, values);
};

module.exports = {
    findByEmail,
    create,
    findByNickname,
    findById,
    getStatsByUserId,
    deleteUser,
    findPasswordById,
    updateUserData
};