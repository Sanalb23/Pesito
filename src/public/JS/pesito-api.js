(function () {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    const API_BASE = 'https://pesito-ejyz.onrender.com';

    async function request(endpoint, options = {}) {
        // En local usamos la ruta tal cual (ej: /users/me, /friends), 
        // si en Render necesitás /api, podés ajustarlo acá si hace falta.
        const formattedEndpoint = endpoint;

        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(`${API_BASE}${formattedEndpoint}`, config);
        
        const contentType = response.headers.get('content-type');
        let result = {};
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        }

        if (!response.ok) {
            throw new Error(result.message || `Error del servidor (${response.status})`);
        }

        return result.data !== undefined ? result.data : result;
    }

    const session = {
        getCurrentUser: () => request('/users/me')
    };

    const users = {
        search: (query) => request(`/users/search?query=${encodeURIComponent(query)}`),
        getUserById: (userId) => request(`/users/${userId}`),
        getMyStats: () => request('/users/me/stats'),
        getUserStats: (userId) => request(`/users/${userId}/stats`),
        getMyMatches: () => request('/users/me/matches'),
        changePassword: (data) => request('/users/me/password', { method: 'PATCH', body: data }),
        deleteAccount: () => request('/users/me', { method: 'DELETE' })
    };

    const friends = {
        getFriends: () => request('/friends'),
        sendFriendRequest: (userId) => request(`/friends/${userId}`, { method: 'POST' }),
        acceptFriendRequest: (userId) => request(`/friends/${userId}`, { method: 'PATCH' }),
        rejectFriendRequest: (userId) => request(`/friends/${userId}`, { method: 'DELETE' }),
        deleteFriend: (userId) => request(`/friends/${userId}`, { method: 'DELETE' }),
        getFriendshipStatus: (userId) => request(`/friends/${userId}`)
    };

    const games = {
        getGames: () => request('/games'),
        getLeaguesByGame: (gameId) => request(`/games/${gameId}/leagues`),
        getTeamsOfGame: async (gameId) => {
            const leagues = await games.getLeaguesByGame(gameId);
            const groups = [];
            for (const league of leagues) {
                const teams = await request(`/games/${gameId}/leagues/${league.id}/teams`);
                if (teams && teams.length > 0) {
                    groups.push({ leagueName: league.name, teams });
                }
            }
            return groups;
        },
        getTeamsByLeagueAndGame: (gameId, leagueId) => request(`/games/${gameId}/leagues/${leagueId}/teams`)
    };

    const matches = {
        getMyMatches: () => request('/users/me/matches'),
        getMatchesByUserId: (userId) => request(`/users/${userId}/matches`),
        getMatchDetails: (matchIds) => {
            return Promise.all(matchIds.map(id => request(`/matches/${id}`)));
        },
        createMatch: (matchData) => request('/matches', { method: 'POST', body: matchData }),
        detectPhoto: async (formData) => {
            const response = await fetch(`${API_BASE}/matches/detect`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al detectar estadísticas');
            return result.data;
        }
    };

    const notifications = {
        getNotifications: () => request('/notifications'),
        markAsRead: (notificationId) => request(`/notifications/${notificationId}`, { method: 'PATCH' }),
        markAllAsRead: () => request('/notifications/all', { method: 'PATCH' }),
        deleteNotification: (notificationId) => request(`/notifications/${notificationId}`, { method: 'DELETE' })
    };

    window.pesitoApi = {
        session,
        users,
        friends,
        games,
        matches,
        notifications
    };
})();