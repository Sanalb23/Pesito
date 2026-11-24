(function () {
    const api = window.pesitoApi;
    const calc = window.pesitoStatsCalc;
    const escapeHtml = window.pesitoEscapeHtml;

    const state = {
        currentUser: null,
        profileUser: null,
        profileStats: null,
        h2hMatches: []
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    function renderProfile(user, stats) {
        const modal = document.getElementById('player-profile');
        if (!modal) return;

        // Información básica
        document.getElementById('pp-nickname').textContent = user.nickname;
        document.querySelector('.pp-since').textContent = `Miembro desde ${formatDate(user.created_at)}`;

        // Nivel
        const progress = calc.getLevelProgress(user.total_xp || 0);
        document.querySelector('.pp-level').textContent = `Nivel ${progress.level}`;

        // Estadísticas
        if (stats) {
            const summary = stats.summary;
            document.querySelector('.pp-stat:nth-child(1) strong').textContent = summary.matches;
            document.querySelector('.pp-stat:nth-child(2) strong').textContent = summary.wins;
            document.querySelector('.pp-stat:nth-child(3) strong').textContent = summary.losses;
            document.querySelector('.pp-stat:nth-child(4) strong').textContent = `${Math.round((summary.wins / summary.matches) * 100)}%`;
        }

        // Guardar ID en el modal para referencias futuras
        modal.dataset.userId = user.id;
    }

    function renderH2H(currentUserId, profileUserId, matches) {
        const h2hSection = document.querySelector('.pl-h2h');
        if (!h2hSection) return;

        // Filtrar partidos entre los dos usuarios
        const h2hMatches = matches.filter(m =>
            (m.home_user_id === currentUserId && m.away_user_id === profileUserId) ||
            (m.home_user_id === profileUserId && m.away_user_id === currentUserId)
        );

        if (h2hMatches.length === 0) {
            h2hSection.innerHTML = '<p class="pp-section-title">No tienes partidos contra este jugador</p>';
            return;
        }

        let wins = 0, draws = 0, losses = 0;
        h2hMatches.forEach(match => {
            const isHome = match.home_user_id === currentUserId;
            const myGoals = isHome ? match.home_goals : match.away_goals;
            const rivalGoals = isHome ? match.away_goals : match.home_goals;

            if (myGoals > rivalGoals) wins++;
            else if (myGoals < rivalGoals) losses++;
            else draws++;
        });

        const total = h2hMatches.length;
        const winShare = (wins / total) * 100;
        const drawShare = (draws / total) * 100;
        const lossShare = (losses / total) * 100;

        const bar = document.querySelector('.pl-h2h-bar');
        if (bar) {
            bar.style.setProperty('--share-win', `${winShare}%`);
            bar.style.setProperty('--share-draw', `${drawShare}%`);
            bar.style.setProperty('--share-loss', `${lossShare}%`);
            bar.innerHTML = `
                <span class="pl-h2h-mine" style="--share: ${winShare}%"></span>
                <span class="pl-h2h-draw" style="--share: ${drawShare}%"></span>
                <span class="pl-h2h-rival" style="--share: ${lossShare}%"></span>
            `;
        }

        const legend = document.querySelector('.pl-h2h-legend');
        if (legend) {
            legend.innerHTML = `
                <span>Tú <strong>${wins}</strong></span>
                <span>Empates <strong>${draws}</strong></span>
                <span>${escapeHtml(state.profileUser?.nickname) || 'Él'} <strong>${losses}</strong></span>
            `;
        }
    }

    async function loadProfile(userId) {
        try {
            const [user, stats, currentUser] = await Promise.all([
                api.users.getUserById(userId),
                api.users.getUserStats(userId),
                api.session.getCurrentUser()
            ]);

            state.profileUser = user;
            state.profileStats = stats;
            state.currentUser = currentUser;

            renderProfile(user, stats);

            // Cargar partidos H2H
            const myMatches = await api.users.getMyMatches();
            renderH2H(currentUser.id, userId, myMatches);

            // Verificar estado de amistad
            const friendshipStatus = await api.friends.getFriendshipStatus(userId);
            const deleteBtn = document.querySelector('.pp-danger-button');
            if (deleteBtn) {
                if (friendshipStatus.status === 'active') {
                    deleteBtn.textContent = 'Eliminar amigo';
                    deleteBtn.classList.remove('hidden');
                } else {
                    deleteBtn.classList.add('hidden');
                }
            }

        } catch (error) {
            console.error('Error al cargar perfil:', error);
            alert(`Error al cargar el perfil: ${error.message || 'intentá de nuevo.'}`);
        }
    }

    // Abrir perfil desde enlaces
    document.addEventListener('click', (e) => {
        const profileLink = e.target.closest('a[href="#player-profile"]');
        if (profileLink) {
            e.preventDefault();
            const userId = profileLink.dataset.profileId;
            if (userId) {
                loadProfile(userId);
            }
        }
    });

    // Cerrar modal
    const closeBtn = document.getElementById('close-player-profile');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('player-profile');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Botón de eliminar amigo
    const deleteFriendBtn = document.querySelector('.pp-danger-button');
    if (deleteFriendBtn) {
        deleteFriendBtn.addEventListener('click', async () => {
            const modal = document.getElementById('player-profile');
            const userId = modal?.dataset.userId;
            if (!userId) return;

            if (!confirm('¿Estás seguro de que quieres eliminar a este amigo?')) return;

            try {
                await api.friends.deleteFriend(userId);
                alert('Amigo eliminado.');
                deleteFriendBtn.classList.add('hidden');
            } catch (error) {
                console.error('Error al eliminar amigo:', error);
                alert(`Error al eliminar al amigo: ${error.message || 'intentá de nuevo.'}`);
            }
        });
    }

    // Botón de comparar estadísticas
    const compareBtn = document.querySelector('.pp-actions .analize-button');
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            alert('La comparación de estadísticas estará disponible pronto.');
        });
    }

    // Botón de registrar partido
    const registerMatchBtn = document.querySelector('.pp-ghost-button');
    if (registerMatchBtn) {
        registerMatchBtn.addEventListener('click', () => {
            const modal = document.getElementById('player-profile');
            if (modal) {
                modal.classList.add('hidden');
            }
            const registerBtn = document.getElementById('match-register');
            if (registerBtn) {
                registerBtn.click();
            }
        });
    }
})();
