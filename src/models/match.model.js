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

const editMatch = async (matchId, matchData) => {
    const query = `
        UPDATE matches
        SET home_user_id = $1, away_user_id = $2,
        home_team_game_id = $3, away_team_game_id = $4,
        home_goals = $5, away_goals = $6,
        date = $7
        WHERE id = $8
        RETURNING id;
    `;

    const matchResult = await pool.query(query, [matchData.homeUserId, matchData.awayUserId, matchData.homeTeamId, matchData.awayTeamId, matchData.homeGoals, matchData.awayGoals, matchData.date, matchId]);

    const updatedMatchId = matchResult.rows[0].id;

    const statsQuery = `
        UPDATE match_stats
        SET home_possession = $1, away_possession = $2, home_shots = $3, away_shots = $4,
            home_shots_on_target = $5, away_shots_on_target = $6, home_penalties = $7, away_penalties = $8,
            home_free_kicks = $9, away_free_kicks = $10, home_corner_kicks = $11, away_corner_kicks = $12,
            home_offsides = $13, away_offsides = $14, home_fouls = $15, away_fouls = $16,
            home_yellow_cards = $17, away_yellow_cards = $18, home_red_cards = $19, away_red_cards = $20
        WHERE match_id = $21;
    `;

    await pool.query(statsQuery, [
        matchData.stats.homePossession, matchData.stats.awayPossession,
        matchData.stats.homeShots, matchData.stats.awayShots,
        matchData.stats.homeShotsOnTarget, matchData.stats.awayShotsOnTarget,
        matchData.stats.homePenalties, matchData.stats.awayPenalties,
        matchData.stats.homeFreeKicks, matchData.stats.awayFreeKicks,
        matchData.stats.homeCornerKicks, matchData.stats.awayCornerKicks,
        matchData.stats.homeOffsides, matchData.stats.awayOffsides,
        matchData.stats.homeFouls, matchData.stats.awayFouls,
        matchData.stats.homeYellowCards, matchData.stats.awayYellowCards,
        matchData.stats.homeRedCards, matchData.stats.awayRedCards,
        matchId
    ]);

    return updatedMatchId;
};

const deleteMatch = async (matchId) => {
    const query = `
        DELETE FROM matches
        WHERE id = $1;
    `;

    const result = await pool.query(query, [matchId]);

    return result.rowCount > 0;
};


module.exports = {
    create,
    getMatchesByUserId,
    getMatchData,
    editMatch,
    deleteMatch
};