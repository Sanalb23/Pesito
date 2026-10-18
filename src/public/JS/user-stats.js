(function () {
    const RESULT_STYLES = {
        win: { letter: 'G', title: 'Victoria', className: 'us-win' },
        draw: { letter: 'E', title: 'Empate', className: 'us-draw' },
        loss: { letter: 'P', title: 'Derrota', className: 'us-loss' }
    };

    const EMPTY_VALUE = '—';
    const DEFAULT_ERROR_MESSAGE = 'Hubo un problema al traer tus estadísticas. Inténtalo de nuevo.';
    const STATE_NAMES = ['loading', 'error', 'empty', 'dashboard'];

    const api = window.pesitoApi;
    const calc = window.pesitoStatsCalc;

    const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

    const openStatsLink = document.querySelector('#user-stats');
    const retryButton = document.querySelector('#us-retry-button');
    const errorMessage = document.querySelector('#us-error-message');

    const states = {
        loading: document.querySelector('#us-loading'),
        error: document.querySelector('#us-error'),
        empty: document.querySelector('#us-empty'),
        dashboard: document.querySelector('#us-dashboard')
    };

    const xpBar = document.querySelector('#us-xp-bar');
    const xpFill = document.querySelector('#us-xp-fill');
    const resultBar = document.querySelector('#us-result-bar');
    const recentList = document.querySelector('#us-recent-list');
    const averagesSection = document.querySelector('#us-averages');
    const compareContainer = document.querySelector('#us-compare');

    let latestRequestId = 0;


    function showState(stateName) {
        STATE_NAMES.forEach((name) => {
            states[name].hidden = name !== stateName;
        });
    }


    function toCount(value) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : 0;
    }

    function formatNumber(value) {
        return numberFormat.format(toCount(value));
    }

    function formatSigned(value) {
        const number = Number(value) || 0;
        return (number > 0 ? '+' : '') + numberFormat.format(number);
    }

    function formatMatchCount(count) {
        return `${formatNumber(count)} ${toCount(count) === 1 ? 'partido' : 'partidos'}`;
    }

    function formatDate(isoDate) {
        const date = new Date(isoDate);

        if (Number.isNaN(date.getTime())) {
            return EMPTY_VALUE;
        }
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function percentOf(part, total) {
        return total > 0 ? (part / total) * 100 : 0;
    }

    function getMatchResult(myGoals, rivalGoals) {
        if (myGoals > rivalGoals) {
            return 'win';
        }
        return myGoals < rivalGoals ? 'loss' : 'draw';
    }


    function setFields(values) {
        document.querySelectorAll('[data-field]').forEach((element) => {
            const name = element.dataset.field;
            if (name in values) {
                element.textContent = values[name];
            }
        });
    }

    function renderProfile(user) {
        const progress = calc.getLevelProgress(user.total_xp);

        xpFill.style.width = `${percentOf(progress.xpInLevel, progress.xpNeeded)}%`;
        xpBar.setAttribute('aria-valuemax', String(progress.xpNeeded));
        xpBar.setAttribute('aria-valuenow', String(progress.xpInLevel));

        return {
            nickname: user.nickname || EMPTY_VALUE,
            level_label: `Nivel ${progress.level}`,
            xp_progress: `${formatNumber(progress.xpInLevel)} / ${formatNumber(progress.xpNeeded)} XP`,
            xp_remaining: `Faltan ${formatNumber(progress.xpRemaining)} XP para el nivel ${progress.level + 1}`,
            total_xp: formatNumber(user.total_xp)
        };
    }

    function renderSummary(summary) {
        const matches = toCount(summary.matches);
        const wins = toCount(summary.wins);
        const draws = toCount(summary.draws);
        const losses = toCount(summary.losses);
        const goalsFor = toCount(summary.goals_for);
        const goalsAgainst = toCount(summary.goals_against);
        const bars = { wins, draws, losses };

        document.querySelectorAll('[data-bar]').forEach((element) => {
            element.style.setProperty('--share', `${percentOf(bars[element.dataset.bar], matches)}%`);
        });
        resultBar.setAttribute('aria-label', `${wins} victorias, ${draws} empates y ${losses} derrotas`);

        return {
            matches: formatNumber(matches),
            wins: formatNumber(wins),
            draws: formatNumber(draws),
            losses: formatNumber(losses),
            win_rate: `${Math.round(percentOf(wins, matches))}%`,
            best_streak: formatNumber(summary.best_streak),
            goals_for: formatNumber(goalsFor),
            goals_against: formatNumber(goalsAgainst),
            goal_difference: formatSigned(goalsFor - goalsAgainst)
        };
    }

    function renderFavorites(favorites) {
        const team = favorites.team;
        const rival = favorites.rival;
        const bestWin = favorites.biggest_win;

        return {
            favorite_team: team ? team.name : EMPTY_VALUE,
            favorite_team_count: team ? formatMatchCount(team.matches) : '',
            best_win_score: bestWin ? `${formatNumber(bestWin.my_goals)} - ${formatNumber(bestWin.rival_goals)}` : EMPTY_VALUE,
            best_win_detail: bestWin ? `vs ${bestWin.rival_nickname} · ${formatDate(bestWin.date)}` : '',
            favorite_rival: rival ? rival.nickname : EMPTY_VALUE,
            favorite_rival_count: rival ? formatMatchCount(rival.matches) : ''
        };
    }


    function createRecentMatch(match) {
        const myGoals = toCount(match.my_goals);
        const rivalGoals = toCount(match.rival_goals);
        const style = RESULT_STYLES[getMatchResult(myGoals, rivalGoals)];

        const item = document.createElement('li');
        item.className = 'us-match';

        const chip = document.createElement('span');
        chip.className = `us-chip ${style.className}`;
        chip.title = style.title;
        chip.textContent = style.letter;

        const score = document.createElement('strong');
        score.textContent = `${myGoals} - ${rivalGoals}`;

        const teams = document.createElement('span');
        teams.className = 'us-match-teams';
        teams.append(`${match.team_name} `, score, ` ${match.rival_team_name}`);

        const details = document.createElement('small');
        details.textContent = `vs ${match.rival_nickname} · ${formatDate(match.date)}`;

        const info = document.createElement('div');
        info.className = 'us-match-info';
        info.append(teams, details);

        item.append(chip, info);
        return item;
    }

    function renderRecentMatches(matches) {
        recentList.replaceChildren(...matches.map(createRecentMatch));
    }

    function createCompareRow({ label, mine, rival }) {
        const total = mine + rival;
        const mineShare = total > 0 ? percentOf(mine, total) : 50;

        const mineValue = document.createElement('span');
        mineValue.className = 'us-compare-value us-compare-mine-value';
        mineValue.textContent = formatNumber(mine);

        const rivalValue = document.createElement('span');
        rivalValue.className = 'us-compare-value';
        rivalValue.textContent = formatNumber(rival);

        const labelElement = document.createElement('span');
        labelElement.className = 'us-compare-label';
        labelElement.textContent = label;

        const mineBar = document.createElement('span');
        mineBar.className = 'us-compare-mine';

        const rivalBar = document.createElement('span');
        rivalBar.className = 'us-compare-rival';

        const bar = document.createElement('div');
        bar.className = 'us-compare-bar';
        bar.style.setProperty('--share', `${mineShare}%`);
        bar.append(mineBar, rivalBar);

        const middle = document.createElement('div');
        middle.className = 'us-compare-middle';
        middle.append(labelElement, bar);

        const row = document.createElement('div');
        row.className = 'us-compare-row';
        row.append(mineValue, middle, rivalValue);
        return row;
    }

    function renderAverages(averages) {
        const hasData = averages.rows.length > 0;

        averagesSection.hidden = !hasData;
        compareContainer.replaceChildren(...averages.rows.map(createCompareRow));

        return {
            averages_note: averages.matchesCount === 1
                ? 'Último partido'
                : `Últimos ${formatNumber(averages.matchesCount)} partidos`
        };
    }


    function renderUserStats({ stats, averages }) {
        setFields({
            ...renderProfile(stats.user),
            ...renderSummary(stats.summary),
            ...renderFavorites(stats.favorites),
            ...renderAverages(averages)
        });
        renderRecentMatches(stats.recent_matches);
    }

    async function loadMatchDetails(matchIds) {
        try {
            return await api.matches.getMatchesDetails(matchIds);
        } catch (error) {
            console.error('No se pudieron cargar las estadísticas de los partidos:', error);
            return [];
        }
    }

    async function fetchUserStats() {
        const [user, matches] = await Promise.all([
            api.session.getCurrentUser(),
            api.users.getMyMatches()
        ]);

        const stats = calc.buildUserStats(matches, user);
        const details = stats.summary.matches > 0 ? await loadMatchDetails(stats.averageMatchIds) : [];

        return { stats, averages: calc.buildAverages(details, user.id) };
    }

    function getLoadErrorMessage(error) {
        const hasServerMessage = error && error.code && error.code !== 'HTTP_ERROR';
        return hasServerMessage ? error.message : DEFAULT_ERROR_MESSAGE;
    }

    async function loadUserStats() {
        latestRequestId += 1;
        const requestId = latestRequestId;
        showState('loading');

        try {
            const result = await fetchUserStats();

            if (requestId !== latestRequestId) {
                return;
            }

            if (result.stats.summary.matches === 0) {
                showState('empty');
                return;
            }

            renderUserStats(result);
            showState('dashboard');
        } catch (error) {
            console.error('Error al cargar las estadísticas:', error);

            if (requestId !== latestRequestId) {
                return;
            }

            errorMessage.textContent = getLoadErrorMessage(error);
            showState('error');
        }
    }


    openStatsLink.addEventListener('click', loadUserStats);
    retryButton.addEventListener('click', loadUserStats);

    showState('loading');
})();
