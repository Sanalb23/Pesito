(function () {
    const AVERAGE_STATS = [
        { key: 'possession', label: 'Posesión (%)' },
        { key: 'shots', label: 'Disparos' },
        { key: 'shots_on_target', label: 'Disparos a puerta' },
        { key: 'fouls', label: 'Faltas' },
        { key: 'corners', label: 'Saques de esquina' },
        { key: 'yellow_cards', label: 'Tarjetas amarillas' }
    ];

    const RESULT_STYLES = {
        win: { letter: 'G', title: 'Victoria', className: 'us-win' },
        draw: { letter: 'E', title: 'Empate', className: 'us-draw' },
        loss: { letter: 'P', title: 'Derrota', className: 'us-loss' }
    };

    const XP_PER_LEVEL_STEP = 100;
    const EMPTY_VALUE = '—';
    const STATE_NAMES = ['loading', 'error', 'empty', 'dashboard'];

    const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

    const openStatsLink = document.querySelector('#user-stats');
    const retryButton = document.querySelector('#us-retry-button');

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
        const [year, month, day] = String(isoDate || '').slice(0, 10).split('-');
        return year && month && day ? `${day}/${month}/${year}` : EMPTY_VALUE;
    }

    function percentOf(part, total) {
        return total > 0 ? (part / total) * 100 : 0;
    }


    function getLevelStartXp(level) {
        return XP_PER_LEVEL_STEP * (level - 1) ** 2;
    }

    function getLevelFromXp(totalXp) {
        let level = Math.floor(Math.sqrt(totalXp / XP_PER_LEVEL_STEP)) + 1;

        while (getLevelStartXp(level + 1) <= totalXp) {
            level += 1;
        }
        while (level > 1 && getLevelStartXp(level) > totalXp) {
            level -= 1;
        }
        return level;
    }

    function getLevelProgress(totalXp) {
        const xp = toCount(totalXp);
        const level = getLevelFromXp(xp);
        const levelStart = getLevelStartXp(level);
        const nextLevelStart = getLevelStartXp(level + 1);

        return {
            level,
            xpInLevel: xp - levelStart,
            xpNeeded: nextLevelStart - levelStart,
            xpRemaining: nextLevelStart - xp
        };
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
        const progress = getLevelProgress(user.total_xp);
        const fillPercent = percentOf(progress.xpInLevel, progress.xpNeeded);

        xpFill.style.width = `${fillPercent}%`;
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
        const game = favorites.game;
        const rival = favorites.rival;

        return {
            favorite_team: team ? team.name : EMPTY_VALUE,
            favorite_team_count: team ? formatMatchCount(team.matches) : '',
            favorite_game: game ? game.name : EMPTY_VALUE,
            favorite_game_count: game ? formatMatchCount(game.matches) : '',
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

    function createCompareRow({ key, label }, mineAverages, rivalAverages) {
        const mine = toCount(mineAverages[key]);
        const rival = toCount(rivalAverages[key]);
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
        const rows = AVERAGE_STATS.map((stat) => createCompareRow(stat, averages.mine || {}, averages.rival || {}));
        compareContainer.replaceChildren(...rows);
    }


    function renderUserStats(stats) {
        const user = stats.user || {};
        const summary = stats.summary || {};

        setFields({
            ...renderProfile(user),
            ...renderSummary(summary),
            ...renderFavorites(stats.favorites || {})
        });
        renderRecentMatches(stats.recent_matches || []);
        renderAverages(stats.averages || {});
    }

    async function loadUserStats() {
        latestRequestId += 1;
        const requestId = latestRequestId;
        showState('loading');

        try {
            const stats = await statsApi.getUserStats();

            if (requestId !== latestRequestId) {
                return;
            }

            if (toCount(stats.summary && stats.summary.matches) === 0) {
                showState('empty');
                return;
            }

            renderUserStats(stats);
            showState('dashboard');
        } catch (error) {
            console.error('Error al cargar las estadísticas:', error);

            if (requestId !== latestRequestId) {
                return;
            }
            showState('error');
        }
    }


    openStatsLink.addEventListener('click', loadUserStats);
    retryButton.addEventListener('click', loadUserStats);

    showState('loading');
})();
