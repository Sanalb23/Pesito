(function () {
    const api = window.pesitoApi;
    const escapeHtml = window.pesitoEscapeHtml;

    const state = {
        friends: [],
        searchResults: [],
        isLoading: false
    };

    function showLoading() {
        document.querySelector('.friends-container').innerHTML = '<p>Cargando...</p>';
    }

    function showError(message) {
        document.querySelector('.friends-container').innerHTML = `<p>Error: ${escapeHtml(message)}</p>`;
    }

    function renderFriend(friend) {
        const isOnline = Math.random() > 0.5;
        return `
            <div class="user-profile" data-user-id="${friend.id}">
                <div class="profile-name-status">
                    <div class="online-status ${!isOnline ? 'is-offline' : ''}"></div>
                    <div class="picture-and-username">
                        <div class="user-picture">
                            <img src="src/public/Logos/proevolutionsoccer-fulllogo.png" alt="">
                        </div>
                        <p>${escapeHtml(friend.nickname)}</p>
                        <span class="pl-team">${friend.favorite_team ? `<i class="ph ph-shield-star"></i>${escapeHtml(friend.favorite_team)}` : 'Sin equipo'}</span>
                    </div>
                </div>
                <div class="see-profile">
                    <a href="#player-profile" data-profile-id="${friend.id}">Ver perfil</a>
                </div>
            </div>
        `;
    }

    function renderSearchResult(user, status) {
        let statusBadge = '';
        if (status === 'active') {
            statusBadge = '<span class="fm-tag fm-tag-friend"><i class="ph ph-check"></i>Ya son amigos</span>';
        } else if (status === 'pending_sent') {
            statusBadge = '<span class="fm-tag fm-tag-pending"><i class="ph ph-hourglass-medium"></i>Pendiente</span>';
        } else if (status === 'pending_received') {
            statusBadge = '<button type="button" class="accept-friend-btn" data-user-id="' + user.id + '">Aceptar</button>';
        } else {
            statusBadge = '<button type="button" class="invite-friend-btn" data-user-id="' + user.id + '"><i class="ph ph-user-plus"></i>&nbsp;Invitar</button>';
        }

        return `
            <div class="user-profile" data-user-id="${user.id}">
                <div class="profile-name-status">
                    <div class="picture-and-username">
                        <div class="user-picture">
                            <img src="src/public/Logos/proevolutionsoccer-fulllogo.png" alt="">
                        </div>
                        <p>${escapeHtml(user.nickname)}</p>
                    </div>
                </div>
                <div class="see-profile">
                    ${statusBadge}
                </div>
            </div>
        `;
    }

    async function loadFriends() {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        try {
            const friends = await api.friends.getFriends();
            state.friends = friends;

            const container = document.querySelector('.fm-panel-list .friends-container');
            if (container) {
                container.innerHTML = friends.map(renderFriend).join('');
            }
        } catch (error) {
            console.error('Error al cargar amigos:', error);
            showError('No se pudieron cargar tus amigos');
        } finally {
            state.isLoading = false;
        }
    }

    async function searchUsers(query) {
        if (!query || query.trim() === '') return;

        try {
            // CORREGIDO: Ahora sí llama exactamente a api.users.search
            const users = await api.users.search(query);
            state.searchResults = users;

            const container = document.querySelector('.fm-panel-invite .fm-results');
            if (container) {
                const results = await Promise.all(
                    users.map(async (user) => {
                        const statusData = await api.friends.getFriendshipStatus(user.id);
                        return renderSearchResult(user, statusData.status);
                    })
                );
                container.innerHTML = results.join('');
            }
        } catch (error) {
            console.error('Error al buscar usuarios:', error);
            alert(`Error al buscar usuarios: ${error.message || 'intentá de nuevo.'}`);
        }
    }

    async function sendFriendRequest(userId) {
        try {
            await api.friends.sendFriendRequest(userId);
            alert('Solicitud de amistad enviada.');
            loadFriends();
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            alert(`Error al enviar la solicitud: ${error.message || 'intentá de nuevo.'}`);
        }
    }

    async function acceptFriendRequest(userId) {
        try {
            await api.friends.acceptFriendRequest(userId);
            alert('Solicitud aceptada.');
            loadFriends();
        } catch (error) {
            console.error('Error al aceptar solicitud:', error);
            alert(`Error al aceptar la solicitud: ${error.message || 'intentá de nuevo.'}`);
        }
    }

    async function deleteFriend(userId) {
        if (!confirm('¿Estás seguro de que quieres eliminar a este amigo?')) return;

        try {
            await api.friends.deleteFriend(userId);
            alert('Amigo eliminado.');
            loadFriends();
        } catch (error) {
            console.error('Error al eliminar amigo:', error);
            alert(`Error al eliminar al amigo: ${error.message || 'intentá de nuevo.'}`);
        }
    }

    // Event listeners
    const friendSearchForm = document.getElementById('friend-search-form');
    if (friendSearchForm) {
        friendSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('friend-search-input');
            if (input) {
                const query = input.value;
                state.friends = state.friends.filter(f =>
                    f.nickname.toLowerCase().includes(query.toLowerCase())
                );
                const container = document.querySelector('.fm-panel-list .friends-container');
                if (container) {
                    container.innerHTML = state.friends.map(renderFriend).join('');
                }
            }
        });
    }

    const playerSearchForm = document.getElementById('player-search-form');
    if (playerSearchForm) {
        playerSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('player-search-input');
            if (input) {
                searchUsers(input.value);
            }
        });
    }

    // Delegación de eventos para botones dinámicos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('invite-friend-btn')) {
            const userId = e.target.dataset.userId;
            sendFriendRequest(userId);
        }

        if (e.target.classList.contains('accept-friend-btn')) {
            const userId = e.target.dataset.userId;
            acceptFriendRequest(userId);
        }

        if (e.target.classList.contains('pp-danger-button')) {
            const modal = document.getElementById('player-profile');
            const userId = modal?.dataset.userId;
            if (userId) {
                deleteFriend(userId);
            }
        }
    });

    // Cargar amigos cuando se abre el modal
    const friendsBackdrop = document.getElementById('friends-backdrop');
    if (friendsBackdrop) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target === friendsBackdrop && !friendsBackdrop.classList.contains('hidden')) {
                    loadFriends();
                }
            });
        });
        observer.observe(friendsBackdrop, { attributes: true, attributeFilter: ['class'] });
    }

    // Copiar enlace de invitación
    const copyInviteLink = document.getElementById('copy-invite-link');
    if (copyInviteLink) {
        copyInviteLink.addEventListener('click', () => {
            const input = document.getElementById('invite-link');
            if (input) {
                input.select();
                document.execCommand('copy');
                alert('Enlace copiado.');
            }
        });
    }

    // Toggle entre paneles (lista de amigos / búsqueda de jugadores)
    const toggleSearchPanel = document.getElementById('toggle-search-panel');
    const toggleListPanel = document.getElementById('toggle-list-panel');
    const fmPanelList = document.querySelector('.fm-panel-list');
    const fmPanelInvite = document.querySelector('.fm-panel-invite');

    if (toggleSearchPanel && fmPanelList && fmPanelInvite) {
        toggleSearchPanel.addEventListener('click', () => {
            fmPanelList.classList.add('hidden');
            fmPanelInvite.classList.remove('hidden');
        });
    }

    if (toggleListPanel && fmPanelList && fmPanelInvite) {
        toggleListPanel.addEventListener('click', () => {
            fmPanelInvite.classList.add('hidden');
            fmPanelList.classList.remove('hidden');
            loadFriends();
        });
    }
})();