// GESTOR DEL PANEL DE NOTIFICACIONES (PESITO)
// Notificaciones de confirmación de carga de partidos por parte de rivales y avisos
(function () {
    const STORAGE_KEY = 'pesito_notifications_v2';

    // Notificaciones por defecto estilo PES / Pesito enfocadas en confirmación de partidos cargados por rivales
    const DEFAULT_NOTIFICATIONS = [
        {
            id: 'notif-match-1',
            type: 'match_confirm',
            title: 'Confirmación de Partido',
            rival: 'ITsF4CU',
            message: 'cargó un partido al historial y necesita tu confirmación.',
            matchData: {
                homeTeam: 'Boca Juniors',
                homeGoals: 2,
                awayTeam: 'River Plate',
                awayGoals: 1,
                game: 'PES 6',
                rivalName: 'ITsF4CU'
            },
            time: 'Hace 5 min',
            unread: true,
            status: 'pending', // 'pending', 'confirmed', 'rejected'
            category: 'match'
        },
        {
            id: 'notif-match-2',
            type: 'match_confirm',
            title: 'Confirmación de Partido',
            rival: 'Lautaro_PES',
            message: 'cargó un resultado reciente a tu historial.',
            matchData: {
                homeTeam: 'Barcelona',
                homeGoals: 3,
                awayTeam: 'Real Madrid',
                awayGoals: 3,
                game: 'PES 2013',
                rivalName: 'Lautaro_PES'
            },
            time: 'Hace 45 min',
            unread: true,
            status: 'pending',
            category: 'match'
        },
        {
            id: 'notif-friend-1',
            type: 'friend',
            title: 'Solicitud de Amistad',
            message: 'Felipe_99 quiere agregarte a su lista de amigos.',
            time: 'Hace 2 horas',
            unread: true,
            status: 'pending',
            hasFriendActions: true,
            category: 'friend'
        },
        {
            id: 'notif-match-3',
            type: 'match_confirm',
            title: 'Partido Confirmado',
            rival: 'NicoGol',
            message: 'Confirmaste el partido contra NicoGol (Pesito FC 4 - 2 Milan).',
            matchData: {
                homeTeam: 'Pesito FC',
                homeGoals: 4,
                awayTeam: 'Milan',
                awayGoals: 2,
                game: 'PES 6',
                rivalName: 'NicoGol'
            },
            time: 'Ayer',
            unread: false,
            status: 'confirmed',
            category: 'match'
        },
        {
            id: 'notif-system-1',
            type: 'system',
            title: 'Aviso del Sistema',
            message: 'Este fin de semana habrá Torneo Relámpago en Pesito. ¡Asegúrate de tener tus partidos al día!',
            time: 'Hace 2 días',
            unread: false,
            status: 'info',
            category: 'system'
        }
    ];

    function loadNotifications() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Error leyendo notificaciones de localStorage', e);
        }
        return structuredClone(DEFAULT_NOTIFICATIONS);
    }

    function saveNotifications() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        } catch (e) {
            console.warn('Error guardando notificaciones', e);
        }
    }

    let notifications = loadNotifications();
    let currentFilter = 'all';
    let currentSearchQuery = '';

    // Elementos del DOM
    const backdrop = document.getElementById('notifications-backdrop');
    const closeBtn = document.getElementById('close-notifications-modal');
    const container = document.getElementById('notifications-container');
    const searchInput = document.getElementById('notification-search-input');
    const clearSearchBtn = document.getElementById('clear-notification-search');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    const clearAllBtn = document.getElementById('clear-all-notifications');
    const tabs = document.querySelectorAll('.notification-tab');
    const desktopBadge = document.getElementById('notifications-badge');
    const mobileBadge = document.getElementById('notifications-badge-mobile');
    const unreadTabCounter = document.getElementById('unread-count-pill');
    const openBtnDesktop = document.getElementById('open-notifications');
    const openBtnMobile = document.getElementById('open-notifications-mobile');
    const openBtnMenu = document.getElementById('user-notifications');

    function updateBadges() {
        const unreadCount = notifications.filter(n => n.unread).length;

        [desktopBadge, mobileBadge].forEach(badge => {
            if (!badge) return;
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('hidden-badge');
            } else {
                badge.classList.add('hidden-badge');
            }
        });

        if (unreadTabCounter) {
            unreadTabCounter.textContent = unreadCount;
            unreadTabCounter.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
    }

    function getIconConfig(type) {
        switch (type) {
            case 'match_confirm':
            case 'match':
                return { icon: 'ph-soccer-ball', class: 'icon-match' };
            case 'friend':
                return { icon: 'ph-user-plus', class: 'icon-friend' };
            case 'trophy':
                return { icon: 'ph-trophy', class: 'icon-trophy' };
            case 'system':
            default:
                return { icon: 'ph-bell', class: 'icon-system' };
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderNotifications() {
        if (!container) return;

        const filtered = notifications.filter(notif => {
            if (currentFilter === 'unread' && !notif.unread) return false;
            if (currentFilter === 'match' && notif.category !== 'match') return false;
            if (currentFilter === 'friend' && notif.category !== 'friend') return false;
            if (currentFilter === 'system' && notif.category !== 'system') return false;

            if (currentSearchQuery.trim() !== '') {
                const q = currentSearchQuery.toLowerCase();
                const title = (notif.title || '').toLowerCase();
                const msg = (notif.message || '').toLowerCase();
                const rival = (notif.rival || '').toLowerCase();
                const home = notif.matchData ? notif.matchData.homeTeam.toLowerCase() : '';
                const away = notif.matchData ? notif.matchData.awayTeam.toLowerCase() : '';
                if (!title.includes(q) && !msg.includes(q) && !rival.includes(q) && !home.includes(q) && !away.includes(q)) {
                    return false;
                }
            }

            return true;
        });

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="notifications-empty">
                    <i class="ph ph-bell-slash"></i>
                    <h3>Sin notificaciones</h3>
                    <p>${currentSearchQuery || currentFilter !== 'all' ? 'No se encontraron resultados con estos filtros.' : 'No tienes notificaciones pendientes. Aquí aparecerán las confirmaciones de partidos de tus rivales.'}</p>
                </div>
            `;
            return;
        }

        filtered.forEach(notif => {
            const card = document.createElement('div');
            card.className = `notification-card ${notif.unread ? 'unread' : ''}`;
            card.setAttribute('data-id', notif.id);

            const iconConfig = getIconConfig(notif.type);

            let previewHtml = '';
            let actionsHtml = '';

            // Caso: Notificación de confirmación de partido subido por un rival
            if (notif.type === 'match_confirm' && notif.matchData) {
                const m = notif.matchData;
                previewHtml = `
                    <div class="match-confirm-preview">
                        <div class="match-confirm-header">
                            <span class="match-rival-badge"><i class="ph ph-user"></i> Rival: ${escapeHtml(m.rivalName || notif.rival)}</span>
                            <span class="match-game-tag">${escapeHtml(m.game)}</span>
                        </div>
                        <div class="match-teams-score">
                            <span class="match-team team-home">${escapeHtml(m.homeTeam)}</span>
                            <span class="match-score-pill">${m.homeGoals} - ${m.awayGoals}</span>
                            <span class="match-team team-away">${escapeHtml(m.awayTeam)}</span>
                        </div>
                    </div>
                `;

                if (notif.status === 'pending') {
                    actionsHtml = `
                        <div class="match-confirm-actions">
                            <button type="button" class="notif-btn notif-btn-accept" data-action="confirm_match">
                                <i class="ph ph-check"></i> Confirmar carga
                            </button>
                            <button type="button" class="notif-btn notif-btn-reject" data-action="reject_match">
                                <i class="ph ph-x"></i> Rechazar
                            </button>
                        </div>
                    `;
                } else if (notif.status === 'confirmed') {
                    actionsHtml = `
                        <div class="notification-actions" style="margin-top: 6px;">
                            <span class="notif-status-tag accepted"><i class="ph ph-check-circle"></i> Partido confirmado en historial</span>
                            <button type="button" class="notif-btn notif-btn-dismiss" data-action="dismiss" title="Descartar">
                                <i class="ph ph-x"></i>
                            </button>
                        </div>
                    `;
                } else if (notif.status === 'rejected') {
                    actionsHtml = `
                        <div class="notification-actions" style="margin-top: 6px;">
                            <span class="notif-status-tag rejected"><i class="ph ph-x-circle"></i> Carga rechazada</span>
                            <button type="button" class="notif-btn notif-btn-dismiss" data-action="dismiss" title="Descartar">
                                <i class="ph ph-x"></i>
                            </button>
                        </div>
                    `;
                }
            } else if (notif.hasFriendActions) {
                if (notif.status === 'pending') {
                    actionsHtml = `
                        <div class="notification-actions">
                            <button type="button" class="notif-btn notif-btn-accept" data-action="accept_friend">
                                <i class="ph ph-check"></i> Aceptar
                            </button>
                            <button type="button" class="notif-btn notif-btn-reject" data-action="reject_friend">
                                <i class="ph ph-x"></i>
                            </button>
                        </div>
                    `;
                } else if (notif.status === 'accepted') {
                    actionsHtml = `
                        <div class="notification-actions">
                            <span class="notif-status-tag accepted"><i class="ph ph-check-circle"></i> Amigo agregado</span>
                            <button type="button" class="notif-btn notif-btn-dismiss" data-action="dismiss"><i class="ph ph-x"></i></button>
                        </div>
                    `;
                } else {
                    actionsHtml = `
                        <div class="notification-actions">
                            <span class="notif-status-tag rejected">Rechazado</span>
                            <button type="button" class="notif-btn notif-btn-dismiss" data-action="dismiss"><i class="ph ph-x"></i></button>
                        </div>
                    `;
                }
            } else {
                actionsHtml = `
                    <div class="notification-actions">
                        <button type="button" class="notif-btn notif-btn-dismiss" data-action="dismiss" title="Descartar">
                            <i class="ph ph-x"></i>
                        </button>
                    </div>
                `;
            }

            const rivalHighlight = notif.rival ? `<strong style="color: yellow;">${escapeHtml(notif.rival)}</strong> ` : '';

            card.innerHTML = `
                <div class="notification-left">
                    <div class="notification-icon-wrapper ${iconConfig.class}">
                        <i class="ph ${iconConfig.icon}"></i>
                        ${notif.unread ? '<span class="notification-pulse-dot"></span>' : ''}
                    </div>
                    <div class="notification-body" style="width: 100%;">
                        <div class="notification-body-header">
                            <h4 class="notification-title">${escapeHtml(notif.title)}</h4>
                            <span class="notification-time">${escapeHtml(notif.time)}</span>
                        </div>
                        <p class="notification-text">${rivalHighlight}${escapeHtml(notif.message)}</p>
                        ${previewHtml}
                        ${actionsHtml}
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (btn) {
                    const action = btn.getAttribute('data-action');
                    handleAction(notif.id, action);
                    return;
                }
                if (notif.unread) {
                    markAsRead(notif.id);
                }
            });

            container.appendChild(card);
        });
    }

    function handleAction(id, action) {
        const item = notifications.find(n => n.id === id);
        if (!item) return;

        item.unread = false;

        if (action === 'confirm_match') {
            item.status = 'confirmed';
            item.message = `Confirmaste la carga de este partido al historial.`;
            // Notificar o sincronizar con historial si está cargado
            if (window.pesitoApi && window.pesitoApi.matches && typeof window.pesitoApi.matches.addMockMatch === 'function') {
                window.pesitoApi.matches.addMockMatch(item.matchData);
            }
        } else if (action === 'reject_match') {
            item.status = 'rejected';
            item.message = `Rechazaste la carga de este partido.`;
        } else if (action === 'accept_friend') {
            item.status = 'accepted';
        } else if (action === 'reject_friend') {
            item.status = 'rejected';
        } else if (action === 'dismiss') {
            notifications = notifications.filter(n => n.id !== id);
        }

        saveNotifications();
        updateBadges();
        renderNotifications();
    }

    function markAsRead(id) {
        const item = notifications.find(n => n.id === id);
        if (item && item.unread) {
            item.unread = false;
            saveNotifications();
            updateBadges();
            renderNotifications();
        }
    }

    function markAllAsRead() {
        let changed = false;
        notifications.forEach(n => {
            if (n.unread) {
                n.unread = false;
                changed = true;
            }
        });
        if (changed) {
            saveNotifications();
            updateBadges();
            renderNotifications();
        }
    }

    function clearAllNotifications() {
        notifications = [];
        saveNotifications();
        updateBadges();
        renderNotifications();
    }

    function openModal(e) {
        if (e) e.preventDefault();
        if (backdrop) {
            backdrop.classList.remove('hidden');
            renderNotifications();
            updateBadges();
        }
    }

    function closeModal() {
        if (backdrop) backdrop.classList.add('hidden');
    }

    if (openBtnDesktop) openBtnDesktop.addEventListener('click', openModal);
    if (openBtnMobile) openBtnMobile.addEventListener('click', openModal);
    if (openBtnMenu) openBtnMenu.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backdrop && !backdrop.classList.contains('hidden')) {
            closeModal();
        }
    });

    if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllAsRead);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllNotifications);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter') || 'all';
            renderNotifications();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            renderNotifications();
        });
    }

    if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchQuery = '';
            renderNotifications();
            searchInput.focus();
        });
    }

    // Inicialización de badges
    updateBadges();

    // API pública para poder emitir cargas de partidos desde cualquier parte
    window.pesitoNotifications = {
        open: openModal,
        close: closeModal,
        addMatchConfirmation: function ({ rivalName, homeTeam, homeGoals, awayTeam, awayGoals, game }) {
            notifications.unshift({
                id: 'notif-match-' + Date.now(),
                type: 'match_confirm',
                title: 'Confirmación de Partido',
                rival: rivalName,
                message: 'cargó un partido al historial y necesita tu confirmación.',
                matchData: {
                    homeTeam,
                    homeGoals,
                    awayTeam,
                    awayGoals,
                    game: game || 'PES 6',
                    rivalName
                },
                time: 'Recién',
                unread: true,
                status: 'pending',
                category: 'match'
            });
            saveNotifications();
            updateBadges();
            renderNotifications();
        }
    };
})();
