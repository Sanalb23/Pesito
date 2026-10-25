(function () {
    const API_BASE = 'https://pesito-ejyz.onrender.com';

    async function getCurrentUser() {
        const response = await fetch(`${API_BASE}/users/me`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener usuario actual');
        const result = await response.json();
        return result.data;
    }

    async function getUserById(userId) {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener usuario');
        const result = await response.json();
        return result.data;
    }

    async function getMyStats() {
        const response = await fetch(`${API_BASE}/users/me/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener estadísticas');
        const result = await response.json();
        return result.data;
    }

    async function getUserStats(userId) {
        const response = await fetch(`${API_BASE}/users/${userId}/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener estadísticas del usuario');
        const result = await response.json();
        return result.data;
    }

    async function getMyMatches() {
        const response = await fetch(`${API_BASE}/users/me/matches`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener partidos');
        const result = await response.json();
        return result.data;
    }

    async function getMatchesByUserId(userId) {
        const response = await fetch(`${API_BASE}/users/${userId}/matches`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener partidos del usuario');
        const result = await response.json();
        return result.data;
    }

    async function getGames() {
        const response = await fetch(`${API_BASE}/games`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener juegos');
        const result = await response.json();
        return result.data;
    }

    async function getLeaguesByGame(gameId) {
        const response = await fetch(`${API_BASE}/games/${gameId}/leagues`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener ligas');
        const result = await response.json();
        return result.data;
    }

    async function getTeamsByLeagueAndGame(gameId, leagueId) {
        const response = await fetch(`${API_BASE}/games/${gameId}/leagues/${leagueId}/teams`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener equipos');
        const result = await response.json();
        return result.data;
    }

    window.commonApi = {
        getCurrentUser,
        getUserById,
        getMyStats,
        getUserStats,
        getMyMatches,
        getMatchesByUserId,
        getGames,
        getLeaguesByGame,
        getTeamsByLeagueAndGame
    };
})();
