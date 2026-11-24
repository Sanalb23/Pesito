(function () {
    const DEFAULT_ERROR_MESSAGE = 'Hubo un problema al traer los equipos y ligas. Inténtalo de nuevo.';
    const STATE_NAMES = ['loading', 'error', 'empty', 'dashboard'];

    const api = window.pesitoApi;

    const openLeaguesLink = document.querySelector('#leagues-and-teams');
    const retryButton = document.querySelector('#lt-retry-button');
    const errorMessage = document.querySelector('#lt-error-message');
    const gameSelect = document.querySelector('#lt-game-select');
    const leaguesContainer = document.querySelector('#lt-leagues-container');

    const states = {
        loading: document.querySelector('#lt-loading'),
        error: document.querySelector('#lt-error'),
        empty: document.querySelector('#lt-empty'),
        dashboard: document.querySelector('#lt-dashboard')
    };

    let games = [];
    let selectedGameId = null;
    let latestRequestId = 0;


    function showState(stateName) {
        STATE_NAMES.forEach((name) => {
            states[name].hidden = name !== stateName;
        });
    }

    function getLoadErrorMessage(error) {
        return error && error.message ? error.message : DEFAULT_ERROR_MESSAGE;
    }

    function fillGameSelect() {
        gameSelect.innerHTML = '';
        games.forEach((game) => {
            const option = document.createElement('option');
            option.value = String(game.id);
            option.textContent = game.name;
            gameSelect.appendChild(option);
        });
        selectedGameId = games.length > 0 ? String(games[0].id) : null;
        gameSelect.value = selectedGameId || '';
    }

    function createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'lt-team';

        const logoWrap = document.createElement('div');
        logoWrap.className = 'lt-team-logo';

        const fallbackIcon = document.createElement('i');
        fallbackIcon.className = 'ph ph-shield';
        logoWrap.appendChild(fallbackIcon);

        if (team.logo_url) {
            const img = document.createElement('img');
            img.src = team.logo_url;
            img.alt = team.name;
            img.loading = 'lazy';
            img.addEventListener('error', () => img.remove());
            logoWrap.appendChild(img);
        }

        const name = document.createElement('span');
        name.className = 'lt-team-name';
        name.textContent = team.name;

        card.append(logoWrap, name);
        return card;
    }

    function renderLeagues(groups) {
        leaguesContainer.innerHTML = '';

        groups.forEach((group) => {
            const section = document.createElement('section');
            section.className = 'lt-league';

            const title = document.createElement('h3');
            title.className = 'lt-league-title';
            title.innerHTML = `${escapeHtml(group.leagueName)} <small>${group.teams.length} ${group.teams.length === 1 ? 'equipo' : 'equipos'}</small>`;

            const grid = document.createElement('div');
            grid.className = 'lt-teams-grid';
            group.teams.forEach((team) => grid.appendChild(createTeamCard(team)));

            section.append(title, grid);
            leaguesContainer.appendChild(section);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function loadTeamsForGame(gameId, requestId) {
        const groups = await api.games.getTeamsOfGame(Number(gameId));

        if (requestId !== latestRequestId) {
            return;
        }

        const validGroups = (groups || []).filter((group) => group.teams && group.teams.length > 0);

        if (validGroups.length === 0) {
            showState('empty');
            return;
        }

        renderLeagues(validGroups);
        showState('dashboard');
    }

    async function loadLeaguesData() {
        const requestId = ++latestRequestId;
        showState('loading');

        try {
            if (games.length === 0) {
                games = await api.games.getGames();
                fillGameSelect();
            }

            if (!selectedGameId) {
                showState('empty');
                return;
            }

            await loadTeamsForGame(selectedGameId, requestId);
        } catch (error) {
            console.error('Error al cargar equipos y ligas:', error);

            if (requestId !== latestRequestId) {
                return;
            }

            errorMessage.textContent = getLoadErrorMessage(error);
            showState('error');
        }
    }

    gameSelect.addEventListener('change', () => {
        selectedGameId = gameSelect.value;
        loadTeamsForGame(selectedGameId, ++latestRequestId).catch((error) => {
            console.error('Error al cargar equipos del juego:', error);
            errorMessage.textContent = getLoadErrorMessage(error);
            showState('error');
        });
    });

    openLeaguesLink.addEventListener('click', loadLeaguesData);
    retryButton.addEventListener('click', loadLeaguesData);

    showState('loading');
})();
