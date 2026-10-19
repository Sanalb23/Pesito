(function () {
    const api = window.pesitoApi;

    const state = {
        matches: [],
        filteredMatches: [],
        currentFilter: 'all',
        searchQuery: '',
        isLoading: false
    };

    function showLoading() {
        document.querySelector('#mm-loading').hidden = false;
        document.querySelector('#mm-error').hidden = true;
        document.querySelector('#mm-empty').hidden = true;
        document.querySelector('#mm-dashboard').hidden = true;
    }

    function showError(message) {
        document.querySelector('#mm-loading').hidden = true;
        document.querySelector('#mm-error').hidden = false;
        document.querySelector('#mm-empty').hidden = true;
        document.querySelector('#mm-dashboard').hidden = true;
        document.querySelector('#mm-error-message').textContent = message;
    }

    function showEmpty() {
        document.querySelector('#mm-loading').hidden = true;
        document.querySelector('#mm-error').hidden = true;
        document.querySelector('#mm-empty').hidden = false;
        document.querySelector('#mm-dashboard').hidden = true;
    }

    function showDashboard() {
        document.querySelector('#mm-loading').hidden = true;
        document.querySelector('#mm-error').hidden = true;
        document.querySelector('#mm-empty').hidden = true;
        document.querySelector('#mm-dashboard').hidden = false;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('es-ES', { month: 'short' });
        const year = date.getFullYear();
        return { day, month, year };
    }

    function determineResult(match, currentUserId) {
        if (!currentUserId) return 'draw';

        const homeGoals = match.home_goals;
        const awayGoals = match.away_goals;
        const homeUserId = match.home_user_id;
        const awayUserId = match.away_user_id;

        if (homeGoals === awayGoals) return 'draw';

        const userIsHome = homeUserId === currentUserId;
        const homeWon = homeGoals > awayGoals;

        if (userIsHome) {
            return homeWon ? 'win' : 'loss';
        } else {
            return homeWon ? 'loss' : 'win';
        }
    }

    function getResultIcon(result) {
        switch (result) {
            case 'win': return 'W';
            case 'loss': return 'L';
            case 'draw': return 'E';
            default: return '?';
        }
    }

    function createMatchElement(match, result) {
        const matchEl = document.createElement('div');
        matchEl.className = 'mm-match';

        const formattedDate = formatDate(match.date);
        const resultIcon = getResultIcon(result);

        matchEl.innerHTML = `
            <div class="mm-match-result mm-${result}">${resultIcon}</div>
            <div class="mm-match-info">
                <div class="mm-match-teams">
                    ${match.home_team_name} <strong>${match.home_goals} - ${match.away_goals}</strong> ${match.away_team_name}
                </div>
                <div class="mm-match-details">
                    <span><i class="ph ph-game-controller"></i> ${match.game_name}</span>
                    ${match.rival_name ? `<span><i class="ph ph-user"></i> vs ${match.rival_name}</span>` : ''}
                </div>
            </div>
            <div class="mm-match-date">
                <strong>${formattedDate.day} ${formattedDate.month}</strong>
                <span>${formattedDate.year}</span>
            </div>
        `;

        return matchEl;
    }

    function renderMatches() {
        const container = document.querySelector('#mm-matches-container');
        container.innerHTML = '';

        if (state.filteredMatches.length === 0) {
            container.innerHTML = '<p style="color: var(--mm-muted); text-align: center; padding: 20px;">No se encontraron partidos con estos filtros.</p>';
            return;
        }

        state.filteredMatches.forEach(match => {
            const result = determineResult(match, state.currentUserId);
            const matchEl = createMatchElement(match, result);
            container.appendChild(matchEl);
        });
    }

    function updateSummary() {
        const total = state.matches.length;
        const wins = state.matches.filter(m => determineResult(m, state.currentUserId) === 'win').length;
        const draws = state.matches.filter(m => determineResult(m, state.currentUserId) === 'draw').length;
        const losses = state.matches.filter(m => determineResult(m, state.currentUserId) === 'loss').length;

        document.querySelector('[data-field="total"]').textContent = total;
        document.querySelector('[data-field="wins"]').textContent = wins;
        document.querySelector('[data-field="draws"]').textContent = draws;
        document.querySelector('[data-field="losses"]').textContent = losses;
    }

    function filterMatches() {
        state.filteredMatches = state.matches.filter(match => {
            const result = determineResult(match, state.currentUserId);

            // Filtro por resultado
            if (state.currentFilter !== 'all' && result !== state.currentFilter) {
                return false;
            }

            // Filtro por búsqueda
            if (state.searchQuery) {
                const query = state.searchQuery.toLowerCase();
                const matchText = `${match.home_team_name} ${match.away_team_name} ${match.rival_name || ''} ${match.game_name}`.toLowerCase();
                return matchText.includes(query);
            }

            return true;
        });

        renderMatches();
    }

    async function loadMatches() {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        try {
            const [matches, currentUser] = await Promise.all([
                api.matches.getMatches(),
                api.session.getCurrentUser()
            ]);

            state.matches = matches;
            state.currentUserId = currentUser.id;
            state.filteredMatches = matches;

            if (matches.length === 0) {
                showEmpty();
            } else {
                updateSummary();
                filterMatches();
                showDashboard();
            }
        } catch (error) {
            console.error('Error al cargar partidos:', error);
            // DATOS DE EJEMPLO PARA PODER VER LA INTERFAZ
            const mockMatches = [
                {
                    id: 1,
                    date: '2026-10-15',
                    home_goals: 3,
                    away_goals: 1,
                    home_team_name: 'Real Madrid',
                    away_team_name: 'FC Barcelona',
                    game_name: 'PES 5',
                    home_user_id: 1,
                    away_user_id: 2,
                    rival_name: 'Lucho_10'
                },
                {
                    id: 2,
                    date: '2026-10-14',
                    home_goals: 2,
                    away_goals: 2,
                    home_team_name: 'AC Milan',
                    away_team_name: 'Inter',
                    game_name: 'PES 5',
                    home_user_id: 1,
                    away_user_id: 3,
                    rival_name: 'MatiGol'
                },
                {
                    id: 3,
                    date: '2026-10-13',
                    home_goals: 0,
                    away_goals: 2,
                    home_team_name: 'Boca Juniors',
                    away_team_name: 'River Plate',
                    game_name: 'PES 5',
                    home_user_id: 4,
                    away_user_id: 1,
                    rival_name: 'ITsF4CU'
                }
            ];
            state.matches = mockMatches;
            state.currentUserId = 1;
            state.filteredMatches = mockMatches;
            updateSummary();
            filterMatches();
            showDashboard();
        } finally {
            state.isLoading = false;
        }
    }

    function handleFilterClick(event) {
        const btn = event.target;
        const filter = btn.getAttribute('data-filter');

        document.querySelectorAll('.mm-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.currentFilter = filter;
        filterMatches();
    }

    function handleSearchInput(event) {
        state.searchQuery = event.target.value;
        filterMatches();
    }

    function handleRegisterFirst() {
        const registerButton = document.querySelector('#match-register');
        if (registerButton) {
            registerButton.click();
        }
    }

    const openMyMatchesButton = document.querySelector('#my-matches');
    if (openMyMatchesButton) {
        openMyMatchesButton.addEventListener('click', (event) => {
            event.preventDefault();
            loadMatches();
        });
    }

    // Cargar partidos cuando se abre la sección
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target === myMatchesMenu && !myMatchesMenu.hidden) {
                loadMatches();
            }
        });
    });

    const myMatchesMenu = document.querySelector('.my-matches-menu');
    if (myMatchesMenu) {
        observer.observe(myMatchesMenu, { attributes: true, attributeFilter: ['hidden'] });
    }

    const filterButtons = document.querySelectorAll('.mm-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });

    const searchInput = document.querySelector('#mm-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }

    const registerFirstButton = document.querySelector('#mm-register-first');
    if (registerFirstButton) {
        registerFirstButton.addEventListener('click', handleRegisterFirst);
    }

    const retryButton = document.querySelector('#mm-retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', loadMatches);
    }
})();
