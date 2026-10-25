(function () {
    const API_BASE = 'http://localhost:4000';

    async function getFriends() {
        const response = await fetch(`${API_BASE}/friends`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener amigos');
        const result = await response.json();
        return result.data;
    }

    async function sendFriendRequest(userId) {
        const response = await fetch(`${API_BASE}/friends/${userId}`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al enviar solicitud de amistad');
        const result = await response.json();
        return result.data;
    }

    async function acceptFriendRequest(userId) {
        const response = await fetch(`${API_BASE}/friends/${userId}`, {
            method: 'PATCH',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al aceptar solicitud');
        const result = await response.json();
        return result.data;
    }

    async function rejectFriendRequest(userId) {
        const response = await fetch(`${API_BASE}/friends/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al rechazar solicitud');
        const result = await response.json();
        return result.data;
    }

    async function deleteFriend(userId) {
        const response = await fetch(`${API_BASE}/friends/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al eliminar amigo');
        const result = await response.json();
        return result.data;
    }

    async function getFriendshipStatus(userId) {
        const response = await fetch(`${API_BASE}/friends/${userId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener estado de amistad');
        const result = await response.json();
        return result.data;
    }

    async function searchUsers(query) {
        const response = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query)}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al buscar usuarios');
        const result = await response.json();
        return result.data;
    }

    window.friendsApi = {
        getFriends,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        deleteFriend,
        getFriendshipStatus,
        searchUsers
    };
})();
