(function () {
    const FAKE_ANALYSIS_DELAY_MS = 1500;
    const FAKE_REQUEST_DELAY_MS = 200;

    const fakeCurrentUser = { id: 1, nickname: 'Yo' };

    const fakeFriends = [
        { id: 2, nickname: 'ITsF4CU' },
        { id: 3, nickname: 'Lucho_10' },
        { id: 4, nickname: 'MatiGol' }
    ];

    const fakeCatalog = {
        games: [
            { id: 1, name: 'Pro Evolution Soccer 6', release_year: 2006 },
            { id: 2, name: 'Pro Evolution Soccer 2013', release_year: 2012 }
        ],
        teams_games: [
            { id: 1, game_id: 1, team_name: 'A.C. Milan' },
            { id: 2, game_id: 1, team_name: 'Internazionale Milano' },
            { id: 3, game_id: 1, team_name: 'Juventus' },
            { id: 4, game_id: 1, team_name: 'Real Madrid' },
            { id: 5, game_id: 1, team_name: 'FC Barcelona' },
            { id: 6, game_id: 1, team_name: 'Boca Juniors' },
            { id: 7, game_id: 1, team_name: 'River Plate' },
            { id: 8, game_id: 1, team_name: 'Manchester United' },
            { id: 11, game_id: 2, team_name: 'A.C. Milan' },
            { id: 12, game_id: 2, team_name: 'Inter' },
            { id: 13, game_id: 2, team_name: 'Juventus' },
            { id: 14, game_id: 2, team_name: 'Real Madrid' }
        ]
    };

    const fakeAnalysis = {
        home_team: 'A.C. Milan',
        away_team: 'Internazionale Milano',
        home_goals: 4,
        away_goals: 0,
        stats: {
            home: { shots: 21, shots_on_target: 12, penalties: 0, free_kicks: 3, corners: 3, fouls: 6, offsides: 4, yellow_cards: 1, red_cards: 0, possession: 52 },
            away: { shots: 2, shots_on_target: 1, penalties: 0, free_kicks: 6, corners: 0, fouls: 3, offsides: 1, yellow_cards: 1, red_cards: 0, possession: 48 }
        }
    };

    function wait(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    async function getCurrentUser() {
        await wait(FAKE_REQUEST_DELAY_MS);
        return structuredClone(fakeCurrentUser);
    }

    async function getFriends() {
        await wait(FAKE_REQUEST_DELAY_MS);
        return structuredClone(fakeFriends);
    }

    async function getCatalog() {
        await wait(FAKE_REQUEST_DELAY_MS);
        return structuredClone(fakeCatalog);
    }

    async function analyzePhoto(photoFile) {
        await wait(FAKE_ANALYSIS_DELAY_MS);
        return structuredClone(fakeAnalysis);
    }

    async function saveMatch(matchData) {
        await wait(FAKE_REQUEST_DELAY_MS * 3);
        console.log('Partido que se enviaría al backend:', matchData);
        return { match_id: 1 };
    }

    window.matchApi = { getCurrentUser, getFriends, getCatalog, analyzePhoto, saveMatch };
})();
