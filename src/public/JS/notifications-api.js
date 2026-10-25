(function () {
    const API_BASE = 'http://localhost:4000';

    async function getNotifications() {
        const response = await fetch(`${API_BASE}/notifications`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener notificaciones');
        const result = await response.json();
        return result.data;
    }

    async function markAsRead(notificationId) {
        const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
            method: 'PATCH',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al marcar como leída');
        const result = await response.json();
        return result.data;
    }

    async function markAllAsRead() {
        const response = await fetch(`${API_BASE}/notifications/all`, {
            method: 'PATCH',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al marcar todas como leídas');
        const result = await response.json();
        return result.data;
    }

    async function deleteNotification(notificationId) {
        const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al eliminar notificación');
        const result = await response.json();
        return result.data;
    }

    window.notificationsApi = {
        getNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
})();
