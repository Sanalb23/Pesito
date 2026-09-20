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
                match_id, home_possession, away_possession, home_shots, away_shots,
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

module.exports = {
    create
};