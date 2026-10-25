/**
 * match-api.js
 * Cliente de producción para la API de PESITO en Render.
 * Conexión directa a https://pesito-ejyz.onrender.com sin mocks ni simulaciones.
 */
(function () {
    const API_BASE_URL = 'https://pesito-ejyz.onrender.com';
    const LAST_GAME_STORAGE_KEY = 'pesito:lastGameId';
    const USER_STORAGE_KEY = 'pesito:user';
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
    const GAMES_CACHE_KEY = 'pesito:cache:games';
    const TEAMS_CACHE_PREFIX = 'pesito:cache:teams:';

    const memoryCache = {
        games: null,
        teamsByGame: {}
    };

    function readStorageCache(key) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            if (parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_TTL_MS)) {
                return parsed.data;
            }
            window.localStorage.removeItem(key);
            return null;
        } catch (_) {
            return null;
        }
    }

    function writeStorageCache(key, data) {
        try {
            window.localStorage.setItem(key, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        } catch (_) {}
    }

    function clearCatalogCache() {
        memoryCache.games = null;
        memoryCache.teamsByGame = {};
        try {
            window.localStorage.removeItem(GAMES_CACHE_KEY);
            Object.keys(window.localStorage).forEach((key) => {
                if (key.startsWith(TEAMS_CACHE_PREFIX)) {
                    window.localStorage.removeItem(key);
                }
            });
        } catch (_) {}
    }

    /**
     * Realiza peticiones fetch manejando cabeceras, credenciales (cookies JWT) y respuestas JSON.
     */
    async function request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = { ...(options.headers || {}) };

        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            credentials: 'include',
            ...options,
            headers
        };

        const response = await fetch(url, config);

        let data = null;
        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }

        if (!response.ok) {
            const message = (data && data.message) || `Error del servidor (${response.status}): ${response.statusText}`;
            const error = new Error(message);
            error.status = response.status;
            error.code = (data && data.error) || 'HTTP_ERROR';
            error.data = data;
            throw error;
        }

        return data;
    }

    /**
     * Obtiene los datos del usuario autenticado actual desde el backend de Render.
     */
    async function getCurrentUser() {
        try {
            const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                if (parsed && parsed.id) {
                    return parsed;
                }
            }
        } catch (_) {}

        const result = await request('/users/me/stats');
        if (result && result.data && result.data.user) {
            const user = {
                id: result.data.user.id,
                nickname: result.data.user.nickname,
                email: result.data.user.email
            };
            try {
                window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            } catch (_) {}
            return user;
        }

        throw new Error('No se pudo autenticar al usuario actual.');
    }

    /**
     * Obtiene la lista de amigos del usuario autenticado desde el backend de Render.
     */
    async function getFriends() {
        const result = await request('/friends');
        return Array.isArray(result.data) ? result.data : [];
    }

    /**
     * Obtiene la lista de juegos disponibles desde el backend de Render con soporte de caché.
     */
    async function getGames() {
        if (Array.isArray(memoryCache.games) && memoryCache.games.length > 0) {
            return memoryCache.games;
        }

        const cachedGames = readStorageCache(GAMES_CACHE_KEY);
        if (Array.isArray(cachedGames) && cachedGames.length > 0) {
            memoryCache.games = cachedGames;
            return cachedGames;
        }

        const result = await request('/games');
        const games = Array.isArray(result.data) ? result.data : [];
        if (games.length > 0) {
            memoryCache.games = games;
            writeStorageCache(GAMES_CACHE_KEY, games);
        }
        return games;
    }

    /**
     * Obtiene el catálogo de juegos.
     */
    async function getCatalog() {
        const games = await getGames();
        return { games };
    }

    /**
     * Obtiene los equipos disponibles para un juego específico agrupados por ligas desde el backend de Render con soporte de caché.
     */
    async function getTeamsOfGame(gameId) {
        if (!gameId) return [];

        const cacheKey = `${TEAMS_CACHE_PREFIX}${gameId}`;

        if (Array.isArray(memoryCache.teamsByGame[gameId]) && memoryCache.teamsByGame[gameId].length > 0) {
            return memoryCache.teamsByGame[gameId];
        }

        const cachedGroups = readStorageCache(cacheKey);
        if (Array.isArray(cachedGroups) && cachedGroups.length > 0) {
            memoryCache.teamsByGame[gameId] = cachedGroups;
            return cachedGroups;
        }

        const leaguesResult = await request(`/games/${gameId}/leagues`);
        const leagues = Array.isArray(leaguesResult.data) ? leaguesResult.data : [];

        const groups = await Promise.all(
            leagues.map(async (league) => {
                const teamsResult = await request(`/games/${gameId}/leagues/${league.id}/teams`);
                const teams = Array.isArray(teamsResult.data) ? teamsResult.data : [];
                return {
                    leagueId: league.id,
                    leagueName: league.name,
                    teams: teams.map((team) => ({
                        id: team.id,
                        name: team.name
                    }))
                };
            })
        );

        if (groups.length > 0) {
            memoryCache.teamsByGame[gameId] = groups;
            writeStorageCache(cacheKey, groups);
        }

        return groups;
    }

    /**
     * Envía la imagen al backend en Render para procesarla con Gemini y resolver los equipos.
     */
    async function analyzePhoto(photoFile, gameId) {
        const selectedGameId = gameId || window.localStorage.getItem(LAST_GAME_STORAGE_KEY) || 1;

        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('gameId', String(selectedGameId));

        const result = await request('/matches/detect-stats', {
            method: 'POST',
            body: formData
        });

        const data = result.data || {};
        const rawStats = data.stats || {};

        const homeTeam = (data.detectedTeams && (data.detectedTeams.home?.matchedName || data.detectedTeams.home?.detected)) 
            || data.homeTeam 
            || '';
        const awayTeam = (data.detectedTeams && (data.detectedTeams.away?.matchedName || data.detectedTeams.away?.detected)) 
            || data.awayTeam 
            || '';

        return {
            home_team: homeTeam,
            away_team: awayTeam,
            home_goals: data.homeGoals !== undefined ? data.homeGoals : null,
            away_goals: data.awayGoals !== undefined ? data.awayGoals : null,
            stats: {
                home: {
                    shots: rawStats.homeShots ?? rawStats.shots?.home ?? null,
                    shots_on_target: rawStats.homeShotsOnTarget ?? rawStats.shots_on_target?.home ?? null,
                    penalties: rawStats.homePenalties ?? rawStats.penalties?.home ?? null,
                    free_kicks: rawStats.homeFreeKicks ?? rawStats.free_kicks?.home ?? null,
                    corners: rawStats.homeCornerKicks ?? rawStats.corners?.home ?? null,
                    fouls: rawStats.homeFouls ?? rawStats.fouls?.home ?? null,
                    offsides: rawStats.homeOffsides ?? rawStats.offsides?.home ?? null,
                    yellow_cards: rawStats.homeYellowCards ?? rawStats.yellow_cards?.home ?? null,
                    red_cards: rawStats.homeRedCards ?? rawStats.red_cards?.home ?? null,
                    possession: rawStats.homePossession ?? rawStats.possession?.home ?? null
                },
                away: {
                    shots: rawStats.awayShots ?? rawStats.shots?.away ?? null,
                    shots_on_target: rawStats.awayShotsOnTarget ?? rawStats.shots_on_target?.away ?? null,
                    penalties: rawStats.awayPenalties ?? rawStats.penalties?.away ?? null,
                    free_kicks: rawStats.awayFreeKicks ?? rawStats.free_kicks?.away ?? null,
                    corners: rawStats.awayCornerKicks ?? rawStats.corners?.away ?? null,
                    fouls: rawStats.awayFouls ?? rawStats.fouls?.away ?? null,
                    offsides: rawStats.awayOffsides ?? rawStats.offsides?.away ?? null,
                    yellow_cards: rawStats.awayYellowCards ?? rawStats.yellow_cards?.away ?? null,
                    red_cards: rawStats.awayRedCards ?? rawStats.red_cards?.away ?? null,
                    possession: rawStats.awayPossession ?? rawStats.possession?.away ?? null
                }
            },
            raw: data
        };
    }

    /**
     * Envía la creación del partido al backend en Render.
     */
    async function createMatch(matchData) {
        const stats = matchData.stats || {};

        const payload = {
            homeUserId: matchData.home_user_id !== undefined ? matchData.home_user_id : (matchData.homeUserId ?? null),
            awayUserId: matchData.away_user_id !== undefined ? matchData.away_user_id : (matchData.awayUserId ?? null),
            homeTeamId: matchData.home_team_game_id !== undefined ? matchData.home_team_game_id : (matchData.homeTeamId ?? null),
            awayTeamId: matchData.away_team_game_id !== undefined ? matchData.away_team_game_id : (matchData.awayTeamId ?? null),
            homeGoals: matchData.home_goals !== undefined ? matchData.home_goals : (matchData.homeGoals ?? 0),
            awayGoals: matchData.away_goals !== undefined ? matchData.away_goals : (matchData.awayGoals ?? 0),
            stats: {
                homePossession: stats.home_possession ?? stats.homePossession ?? null,
                awayPossession: stats.away_possession ?? stats.awayPossession ?? null,
                homeShots: stats.home_shots ?? stats.homeShots ?? null,
                awayShots: stats.away_shots ?? stats.awayShots ?? null,
                homeShotsOnTarget: stats.home_shots_on_target ?? stats.homeShotsOnTarget ?? null,
                awayShotsOnTarget: stats.away_shots_on_target ?? stats.awayShotsOnTarget ?? null,
                homePenalties: stats.home_penalties ?? stats.homePenalties ?? null,
                awayPenalties: stats.away_penalties ?? stats.awayPenalties ?? null,
                homeFreeKicks: stats.home_free_kicks ?? stats.homeFreeKicks ?? null,
                awayFreeKicks: stats.away_free_kicks ?? stats.awayFreeKicks ?? null,
                homeCornerKicks: stats.home_corners ?? stats.homeCornerKicks ?? null,
                awayCornerKicks: stats.away_corners ?? stats.awayCornerKicks ?? null,
                homeOffsides: stats.home_offsides ?? stats.homeOffsides ?? null,
                awayOffsides: stats.away_offsides ?? stats.awayOffsides ?? null,
                homeFouls: stats.home_fouls ?? stats.homeFouls ?? null,
                awayFouls: stats.away_fouls ?? stats.awayFouls ?? null,
                homeYellowCards: stats.home_yellow_cards ?? stats.homeYellowCards ?? null,
                awayYellowCards: stats.away_yellow_cards ?? stats.awayYellowCards ?? null,
                homeRedCards: stats.home_red_cards ?? stats.homeRedCards ?? null,
                awayRedCards: stats.away_red_cards ?? stats.awayRedCards ?? null
            }
        };

        return await request('/matches', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function saveMatch(matchData) {
        return await createMatch(matchData);
    }

    const matchApi = {
        getCurrentUser,
        getFriends,
        getGames,
        getCatalog,
        getTeamsOfGame,
        analyzePhoto,
        createMatch,
        saveMatch,
        clearCatalogCache,
        games: {
            getGames,
            getTeamsOfGame,
            getCatalog,
            clearCatalogCache
        },
        friends: {
            getFriends
        },
        session: {
            getCurrentUser
        },
        analysis: {
            analyzePhoto
        },
        matches: {
            createMatch,
            saveMatch
        }
    };

    window.matchApi = matchApi;
    window.pesitoApi = window.pesitoApi || matchApi;
})();
