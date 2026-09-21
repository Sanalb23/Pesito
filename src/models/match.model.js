const pool = require("../config/db");

const create = async (matchData) => {
    const { stats } = matchData;

    const matchQuery = `
        INSERT INTO matches (home_user_id, away_user_id, home_team_game_id, away_team_game_id, home_goals, away_goals)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
    `;

    const matchResult = await pool.query(matchQuery, [
        matchData.homeUserId,
        matchData.awayUserId,
        matchData.homeTeamId,
        matchData.awayTeamId,
        matchData.homeGoals,
        matchData.awayGoals
    ]);

    const matchId = matchResult.rows[0].id;

    if (stats) {
        const statsQuery = `
            INSERT INTO match_stats (
                match_id, home_possession, away_possession, home_shots, away_shots, home_shots_on_target, away_shots_on_target,
                home_penalties, away_penalties, home_free_kicks, away_free_kicks,
                home_corner_kicks, away_corner_kicks, home_offsides, away_offsides,
                home_fouls, away_fouls, home_yellow_cards, away_yellow_cards,
                home_red_cards, away_red_cards
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) RETURNING id
        `;

        await pool.query(statsQuery, [
            matchId,
            stats.homePossession,
            stats.awayPossession,
            stats.homeShots,
            stats.awayShots,
            stats.homeShotsOnTarget,
            stats.awayShotsOnTarget,
            stats.homePenalties,
            stats.awayPenalties,
            stats.homeFreeKicks,
            stats.awayFreeKicks,
            stats.homeCornerKicks,
            stats.awayCornerKicks,
            stats.homeOffsides,
            stats.awayOffsides,
            stats.homeFouls,
            stats.awayFouls,
            stats.homeYellowCards,
            stats.awayYellowCards,
            stats.homeRedCards,
            stats.awayRedCards
        ]);
    }

    return matchResult.rows[0];
};

const getMatchesByUserId = async (userId) => {
    const query = `
        SELECT m.id, u1.id as home_user_id, COALESCE(u1.nickname, 'Invitado') as home_user_nickname,
        t1.name as home_team_name,
        u2.id as away_user_id, COALESCE(u2.nickname, 'Invitado') as away_user_nickname,
        t2.name as away_team_name,
        m.home_goals, m.away_goals, m.date
        FROM matches m
        LEFT JOIN users u1 ON m.home_user_id = u1.id
        LEFT JOIN users u2 ON m.away_user_id = u2.id
        INNER JOIN teams_games tg1 ON m.home_team_game_id = tg1.id
        INNER JOIN teams_games tg2 ON m.away_team_game_id = tg2.id
        INNER JOIN teams t1 ON tg1.team_id = t1.id
        INNER JOIN teams t2 ON tg2.team_id = t2.id
        WHERE m.home_user_id = $1 OR m.away_user_id = $1
        ORDER BY date DESC;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
};

const getMatchData = async (matchId) => {
    const query = `
        SELECT 
        m.id, 
        m.home_user_id, 
        COALESCE(u1.nickname, 'Invitado') as home_user_nickname, 
        t1.name as home_team_name, 
        m.away_user_id, 
        COALESCE(u2.nickname, 'Invitado') as away_user_nickname, 
        t2.name as away_team_name, 
        m.home_goals, 
        m.away_goals, 
        m.date
        FROM matches m
        LEFT JOIN users u1 ON m.home_user_id = u1.id
        LEFT JOIN users u2 ON m.away_user_id = u2.id
        INNER JOIN teams_games tg1 ON m.home_team_game_id = tg1.id
        INNER JOIN teams_games tg2 ON m.away_team_game_id = tg2.id
        INNER JOIN teams t1 ON tg1.team_id = t1.id
        INNER JOIN teams t2 ON tg2.team_id = t2.id
        WHERE m.id = $1
    `;

    const result = await pool.query(query, [matchId]);

    const matchData = result.rows[0];

    if (!matchData) {
        return null;
    }

    const statsQuery = `
        SELECT * FROM match_stats WHERE match_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [matchId]);
    const statsData = statsResult.rows[0];

    matchData.stats = statsData;

    return matchData;
};

module.exports = {
    create,
    getMatchesByUserId,
    getMatchData
};