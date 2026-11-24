(function () {
    const api = window.pesitoApi.notifications;
    const escapeHtml = window.pesitoEscapeHtml;

    const state = {
        notifications: [],
        currentFilter: 'all',
        isLoading: false
    };

    function showLoading() {
        document.querySelector('#nt-loading').hidden = false;
        document.querySelector('#nt-error').hidden = true;
        document.querySelector('#nt-empty').hidden = true;
        document.querySelector('#nt-dashboard').hidden = true;
    }

    function showError(message) {
        document.querySelector('#nt-loading').hidden = true;
        document.querySelector('#nt-error').hidden = false;
        document.querySelector('#nt-empty').hidden = true;
        document.querySelector('#nt-dashboard').hidden = true;
        document.querySelector('#nt-error-message').textContent = message;
    }

    function showEmpty() {
        document.querySelector('#nt-loading').hidden = true;
        document.querySelector('#nt-error').hidden = true;
        document.querySelector('#nt-empty').hidden = false;
        document.querySelector('#nt-dashboard').hidden = true;
    }

    function showDashboard() {
        document.querySelector('#nt-loading').hidden = true;
        document.querySelector('#nt-error').hidden = true;
        document.querySelector('#nt-empty').hidden = true;
        document.querySelector('#nt-dashboard').hidden = false;
    }

    const TYPE_TEXT = {
        friend_request: 'te envió una solicitud de amistad',
        friend_confirmation: 'aceptó tu solicitud de amistad',
        match_request: 'te envió una solicitud de partido',
        match_confirmation: 'confirmó un partido',
        match_edit_request: 'quiere editar un partido',
        match_edit_confirmation: 'editó un partido',
        match_delete_request: 'quiere eliminar un partido',
        match_delete_confirmation: 'eliminó un partido'
    };

    function buildNotificationText(notification) {
        const action = TYPE_TEXT[notification.type];
        if (action) {
            const sender = notification.sender_nickname || 'El sistema';
            return `${sender} ${action}`;
        }
        if (typeof notification.content === 'string' && notification.content && notification.content !== '[object Object]') {
            return notification.content;
        }
        return 'Notificación';
    }

    function renderNotification(notification) {
        const isUnread = !notification.is_read;
        const isMatch = notification.type.includes('match');
        const isFriend = notification.type.includes('friend');

        let icon = '<i class="ph ph-bell"></i>';
        if (isMatch) icon = '<i class="ph ph-soccer-ball"></i>';
        if (isFriend) icon = '<i class="ph ph-user-plus"></i>';

        let actions = '';
        if (notification.type === 'friend_request') {
            actions = `
                <div class="nt-actions">
                    <button type="button" class="analize-button accept-friend-btn" data-notification-id="${notification.id}" data-sender-id="${notification.sender_id}">Aceptar</button>
                    <button type="button" class="nt-reject-button reject-friend-btn" data-notification-id="${notification.id}">Rechazar</button>
                </div>
            `;
        } else if (notification.type === 'match_request') {
            actions = `
                <div class="nt-actions">
                    <button type="button" class="analize-button accept-match-btn" data-notification-id="${notification.id}">Confirmar partido</button>
                    <button type="button" class="nt-reject-button reject-match-btn" data-notification-id="${notification.id}">Rechazar</button>
                </div>
            `;
        }

        return `
            <li class="nt-item ${isMatch ? 'nt-kind-match' : ''} ${isFriend ? 'nt-kind-friend' : ''} ${isUnread ? 'nt-unread' : ''}" data-notification-id="${notification.id}">
                <span class="nt-icon">${icon}</span>
                <div class="nt-body">
                    <p class="nt-text">${escapeHtml(buildNotificationText(notification))}</p>
                    <span class="nt-time">${formatTime(notification.created_at)}</span>
                    ${actions}
                </div>
                <button type="button" class="nt-dismiss dismiss-btn" data-notification-id="${notification.id}" aria-label="Descartar notificación"><i class="ph ph-x"></i></button>
            </li>
        `;
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'ahora mismo';
        if (diffMins < 60) return `hace ${diffMins} min`;
        if (diffHours < 24) return `hace ${diffHours} h`;
        if (diffDays < 7) return `hace ${diffDays} días`;
        return date.toLocaleDateString('es-ES');
    }

    function renderNotifications() {
        const list = document.querySelector('#nt-list');
        if (!list) return;

        let filtered = state.notifications;
        if (state.currentFilter === 'matches') {
            filtered = state.notifications.filter(n => n.type.includes('match'));
        } else if (state.currentFilter === 'friends') {
            filtered = state.notifications.filter(n => n.type.includes('friend'));
        }

        if (filtered.length === 0) {
            showEmpty();
            return;
        }

        list.innerHTML = filtered.map(renderNotification).join('');

        // Actualizar contador de no leídas
        const unreadCount = state.notifications.filter(n => !n.is_read).length;
        const unreadBadge = document.querySelector('.nt-unread-count strong');
        if (unreadBadge) {
            unreadBadge.textContent = unreadCount;
        }

        document.querySelectorAll('.nav-badge').forEach((badge) => {
            badge.textContent = unreadCount;
            badge.hidden = unreadCount === 0;
        });
    }

    async function loadNotifications() {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        try {
            const notifications = await api.getNotifications();
            state.notifications = notifications;

            if (notifications.length === 0) {
                showEmpty();
            } else {
                renderNotifications();
                showDashboard();
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            showError('No se pudieron cargar tus notificaciones');
        } finally {
            state.isLoading = false;
        }
    }

    async function markAsRead(notificationId) {
        try {
            await api.markAsRead(notificationId);
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.is_read = true;
                renderNotifications();
            }
        } catch (error) {
            console.error('Error al marcar como leída:', error);
        }
    }

    async function markAllAsRead() {
        try {
            await api.markAllAsRead();
            state.notifications.forEach(n => n.is_read = true);
            renderNotifications();
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    }

    async function deleteNotification(notificationId) {
        try {
            await api.deleteNotification(notificationId);
            state.notifications = state.notifications.filter(n => n.id !== notificationId);
            renderNotifications();
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
        }
    }

    // Event listeners
    const filterInputs = document.querySelectorAll('.nt-filter-input');
    filterInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            state.currentFilter = e.target.id.replace('nt-filter-', '');
            renderNotifications();
        });
    });

    const markAllReadBtn = document.getElementById('nt-mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }

    async function acceptFriendRequest(senderId, notificationId) {
        try {
            await window.pesitoApi.friends.acceptFriendRequest(senderId);
            alert('Solicitud de amistad aceptada.');
            markAsRead(notificationId);
            loadNotifications();
        } catch (error) {
            console.error('Error al aceptar solicitud de amistad:', error);
            alert(`Error al aceptar la solicitud: ${error.message || 'intentá de nuevo.'}`);
        }
    }

    // Delegación de eventos para botones dinámicos
    document.addEventListener('click', (e) => {
        // Descartar notificación
        if (e.target.closest('.dismiss-btn')) {
            const btn = e.target.closest('.dismiss-btn');
            const notificationId = btn.dataset.notificationId;
            deleteNotification(notificationId);
        }

        // Marcar como leída al hacer clic
        if (e.target.closest('.nt-item')) {
            const item = e.target.closest('.nt-item');
            const notificationId = item.dataset.notificationId;
            if (!item.classList.contains('nt-unread')) return;
            markAsRead(notificationId);
        }

        // Aceptar solicitud de amistad
        if (e.target.classList.contains('accept-friend-btn')) {
            const notificationId = e.target.dataset.notificationId;
            const senderId = e.target.dataset.senderId;
            acceptFriendRequest(senderId, notificationId);
        }

        // Rechazar solicitud de amistad
        if (e.target.classList.contains('reject-friend-btn')) {
            const notificationId = e.target.dataset.notificationId;
            deleteNotification(notificationId);
        }

        // Aceptar partido
        if (e.target.classList.contains('accept-match-btn')) {
            const notificationId = e.target.dataset.notificationId;
            alert('La confirmación de partidos todavía no está disponible.');
            markAsRead(notificationId);
        }

        // Rechazar partido
        if (e.target.classList.contains('reject-match-btn')) {
            const notificationId = e.target.dataset.notificationId;
            deleteNotification(notificationId);
        }
    });

    // Cargar notificaciones al abrir la sección (la navegación es por :target/hash)
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#notifications-menu') {
            loadNotifications();
        }
    });

    const ntBackButton = document.getElementById('nt-back-button');
    if (ntBackButton) {
        ntBackButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '';
        });
    }

    // Carga inicial para mostrar el contador de no leídas en la campana
    loadNotifications();

    const retryButton = document.getElementById('nt-retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', loadNotifications);
    }
})();
