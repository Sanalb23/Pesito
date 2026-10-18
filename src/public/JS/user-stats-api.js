(function () {
    const FAKE_REQUEST_DELAY_MS = 600;

    const fakeUserStats = {
        user: {
            id: 1,
            nickname: 'Jugador_01',
            total_xp: 1240
        },
        summary: {
            matches: 24,
            wins: 14,
            draws: 4,
            losses: 6,
            goals_for: 52,
            goals_against: 31,
            best_streak: 5
        },
        recent_matches: [
            { match_id: 24, date: '2026-10-17', team_name: 'A.C. Milan', rival_team_name: 'Internazionale Milano', my_goals: 4, rival_goals: 0, rival_nickname: 'ITsF4CU' },
            { match_id: 23, date: '2026-10-15', team_name: 'Juventus', rival_team_name: 'Real Madrid', my_goals: 1, rival_goals: 1, rival_nickname: 'Lucho_10' },
            { match_id: 22, date: '2026-10-12', team_name: 'FC Barcelona', rival_team_name: 'Boca Juniors', my_goals: 3, rival_goals: 1, rival_nickname: 'MatiGol' },
            { match_id: 21, date: '2026-10-09', team_name: 'River Plate', rival_team_name: 'Manchester United', my_goals: 0, rival_goals: 2, rival_nickname: 'ITsF4CU' },
            { match_id: 20, date: '2026-10-06', team_name: 'A.C. Milan', rival_team_name: 'Juventus', my_goals: 2, rival_goals: 1, rival_nickname: 'Lucho_10' }
        ],
        averages: {
            mine: { possession: 54, shots: 14.2, shots_on_target: 7.1, fouls: 7.3, corners: 5.1, yellow_cards: 1.2 },
            rival: { possession: 46, shots: 8.5, shots_on_target: 4.2, fouls: 8.9, corners: 3.4, yellow_cards: 1.6 }
        },
        favorites: {
            team: { name: 'A.C. Milan', matches: 9 },
            game: { name: 'Pro Evolution Soccer 6', matches: 20 },
            rival: { nickname: 'ITsF4CU', matches: 8 }
        }
    };

    const fakeEmptyUserStats = {
        user: { id: 1, nickname: 'Jugador_01', total_xp: 0 },
        summary: { matches: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, best_streak: 0 },
        recent_matches: [],
        averages: { mine: {}, rival: {} },
        favorites: { team: null, game: null, rival: null }
    };

    function wait(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    function getFakeMode() {
        return new URLSearchParams(window.location.search).get('stats');
    }

    async function getUserStats() {
        await wait(FAKE_REQUEST_DELAY_MS);

        const mode = getFakeMode();

        if (mode === 'error') {
            throw new Error('Error simulado al pedir las estadísticas');
        }
        if (mode === 'empty') {
            return structuredClone(fakeEmptyUserStats);
        }
        return structuredClone(fakeUserStats);
    }

    window.statsApi = { getUserStats };
})();
