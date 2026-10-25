(function () {
    // Sistema de niveles basado en XP
    const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

    function getLevelProgress(totalXp) {
        let level = 1;
        let xpInLevel = totalXp;
        let xpNeeded = LEVEL_THRESHOLDS[1];
        let xpRemaining = xpNeeded - xpInLevel;

        for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
            if (totalXp >= LEVEL_THRESHOLDS[i]) {
                level = i + 1;
                xpInLevel = totalXp - LEVEL_THRESHOLDS[i];
                xpNeeded = LEVEL_THRESHOLDS[i + 1] - LEVEL_THRESHOLDS[i];
                xpRemaining = xpNeeded - xpInLevel;
            } else {
                break;
            }
        }

        return { level, xpInLevel, xpNeeded, xpRemaining };
    }

    function determineResult(myGoals, rivalGoals) {
        if (myGoals > rivalGoals) return 'win';
        if (myGoals < rivalGoals) return 'loss';
        return 'draw';
    }

    function buildUserStats(matches, user) {
        if (!matches || matches.length === 0) {
            return {
                user: user || { total_xp: 0, nickname: '' },
                summary: {
                    matches: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goals_for: 0,
                    goals_against: 0,
                    goal_difference: 0,
                    best_streak: 0
                },
                favorites: {
                    team: null,
                    rival: null,
                    biggest_win: null
                },
                recent_matches: [],
                averageMatchIds: []
            };
        }

        let wins = 0, draws = 0, losses = 0;
        let goalsFor = 0, goalsAgainst = 0;
        let currentStreak = 0, bestStreak = 0;
        const teamCount = {};
        const rivalCount = {};
        const teamMap = new Map();
        const rivalMap = new Map();

        matches.forEach(match => {
            const isHome = match.home_user_id === user.id;
            const myGoals = isHome ? match.home_goals : match.away_goals;
            const rivalGoals = isHome ? match.away_goals : match.home_goals;
            const myTeam = isHome ? match.home_team_name : match.away_team_name;
            const rivalTeam = isHome ? match.away_team_name : match.home_team_name;
            const rivalName = isHome ? match.away_nickname : match.home_nickname;

            goalsFor += myGoals;
            goalsAgainst += rivalGoals;

            const result = determineResult(myGoals, rivalGoals);
            if (result === 'win') {
                wins++;
                currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else if (result === 'draw') {
                draws++;
                currentStreak = 0;
            } else {
                losses++;
                currentStreak = 0;
            }

            // Contar equipos
            teamCount[myTeam] = (teamCount[myTeam] || 0) + 1;
            teamMap.set(myTeam, teamCount[myTeam]);

            // Contar rivales
            if (rivalName) {
                rivalCount[rivalName] = (rivalCount[rivalName] || 0) + 1;
                rivalMap.set(rivalName, rivalCount[rivalName]);
            }
        });

        // Equipo favorito
        let favoriteTeam = null;
        let maxTeamCount = 0;
        for (const [team, count] of Object.entries(teamCount)) {
            if (count > maxTeamCount) {
                maxTeamCount = count;
                favoriteTeam = { name: team, matches: count };
            }
        }

        // Rival favorito
        let favoriteRival = null;
        let maxRivalCount = 0;
        for (const [rival, count] of Object.entries(rivalCount)) {
            if (count > maxRivalCount) {
                maxRivalCount = count;
                favoriteRival = { nickname: rival, matches: count };
            }
        }

        // Mejor victoria
        let biggestWin = null;
        let maxGoalDiff = 0;
        matches.forEach(match => {
            const isHome = match.home_user_id === user.id;
            const myGoals = isHome ? match.home_goals : match.away_goals;
            const rivalGoals = isHome ? match.away_goals : match.home_goals;
            const myTeam = isHome ? match.home_team_name : match.away_team_name;
            const rivalName = isHome ? match.away_nickname : match.home_nickname;
            const diff = myGoals - rivalGoals;

            if (diff > maxGoalDiff && diff > 0) {
                maxGoalDiff = diff;
                biggestWin = {
                    my_goals: myGoals,
                    rival_goals: rivalGoals,
                    rival_nickname: rivalName || 'Invitado',
                    date: match.date
                };
            }
        });

        // Últimos partidos (invertidos para mostrar los más recientes primero)
        const recentMatches = matches.slice(-10).reverse().map(match => {
            const isHome = match.home_user_id === user.id;
            return {
                ...match,
                my_goals: isHome ? match.home_goals : match.away_goals,
                rival_goals: isHome ? match.away_goals : match.home_goals,
                team_name: isHome ? match.home_team_name : match.away_team_name,
                rival_team_name: isHome ? match.away_team_name : match.home_team_name,
                rival_nickname: isHome ? match.away_nickname : match.home_nickname
            };
        });

        return {
            user: user || { total_xp: 0, nickname: '' },
            summary: {
                matches: matches.length,
                wins,
                draws,
                losses,
                goals_for: goalsFor,
                goals_against: goalsAgainst,
                goal_difference: goalsFor - goalsAgainst,
                best_streak: bestStreak
            },
            favorites: {
                team: favoriteTeam,
                rival: favoriteRival,
                biggest_win: biggestWin
            },
            recent_matches: recentMatches,
            averageMatchIds: recentMatches.slice(-8).map(m => m.id)
        };
    }

    function buildAverages(matchDetails, userId) {
        if (!matchDetails || matchDetails.length === 0) {
            return { rows: [], matchesCount: 0 };
        }

        const rows = [
            { label: 'Disparos', mine: 0, rival: 0 },
            { label: 'Disparos a puerta', mine: 0, rival: 0 },
            { label: 'Posesión (%)', mine: 0, rival: 0 },
            { label: 'Penaltis', mine: 0, rival: 0 },
            { label: 'Faltas', mine: 0, rival: 0 },
            { label: 'Tarjetas amarillas', mine: 0, rival: 0 }
        ];

        matchDetails.forEach(match => {
            const isHome = match.home_user_id === userId;
            const stats = match.stats || {};

            rows[0].mine += isHome ? (stats.home_shots || 0) : (stats.away_shots || 0);
            rows[0].rival += isHome ? (stats.away_shots || 0) : (stats.home_shots || 0);

            rows[1].mine += isHome ? (stats.home_shots_on_target || 0) : (stats.away_shots_on_target || 0);
            rows[1].rival += isHome ? (stats.away_shots_on_target || 0) : (stats.home_shots_on_target || 0);

            rows[2].mine += isHome ? (stats.home_possession || 0) : (stats.away_possession || 0);
            rows[2].rival += isHome ? (stats.away_possession || 0) : (stats.home_possession || 0);

            rows[3].mine += isHome ? (stats.home_penalties || 0) : (stats.away_penalties || 0);
            rows[3].rival += isHome ? (stats.away_penalties || 0) : (stats.home_penalties || 0);

            rows[4].mine += isHome ? (stats.home_fouls || 0) : (stats.away_fouls || 0);
            rows[4].rival += isHome ? (stats.away_fouls || 0) : (stats.home_fouls || 0);

            rows[5].mine += isHome ? (stats.home_yellow_cards || 0) : (stats.away_yellow_cards || 0);
            rows[5].rival += isHome ? (stats.away_yellow_cards || 0) : (stats.home_yellow_cards || 0);
        });

        // Calcular promedios
        const count = matchDetails.length;
        rows.forEach(row => {
            row.mine = Math.round(row.mine / count);
            row.rival = Math.round(row.rival / count);
        });

        return { rows, matchesCount: count };
    }

    window.pesitoStatsCalc = {
        getLevelProgress,
        determineResult,
        buildUserStats,
        buildAverages
    };
})();
