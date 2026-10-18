(function () {
    const MATCH_STATS = [
        { key: 'shots', label: 'Disparos' },
        { key: 'shots_on_target', label: 'Disparos a puerta' },
        { key: 'penalties', label: 'Penaltis' },
        { key: 'free_kicks', label: 'Saques de falta' },
        { key: 'corners', label: 'Saques de esquina' },
        { key: 'fouls', label: 'Faltas' },
        { key: 'offsides', label: 'Fuera de juego' },
        { key: 'yellow_cards', label: 'Tarjetas amarillas' },
        { key: 'red_cards', label: 'Tarjetas rojas' },
        { key: 'possession', label: 'Posesión (%)', max: 100 }
    ];

    const STEP_NAMES = ['upload', 'loading', 'review', 'success'];
    const MAX_PHOTO_SIZE_MB = 10;
    const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
    const GUEST_VALUE = 'guest';
    const LAST_GAME_STORAGE_KEY = 'pesito:lastGameId';

    const api = window.pesitoApi;

    const openRegisterLink = document.querySelector('#match-register');

    const steps = {
        upload: document.querySelector('#step-upload'),
        loading: document.querySelector('#step-loading'),
        review: document.querySelector('#step-review'),
        success: document.querySelector('#step-success')
    };

    const photoInput = document.querySelector('#result-photo-input');
    const dropzone = document.querySelector('#dropzone');
    const dropzoneEmpty = document.querySelector('#dropzone-empty');
    const photoPreview = document.querySelector('#photo-preview');
    const uploadError = document.querySelector('#upload-error');
    const analyzeButton = document.querySelector('#analyze-button');

    const reviewForm = document.querySelector('#review-form');
    const reviewNotice = document.querySelector('#review-notice');
    const reviewErrors = document.querySelector('#review-errors');
    const reviewErrorsList = document.querySelector('#review-errors-list');
    const gameSelect = document.querySelector('#game-select');
    const rivalSelect = document.querySelector('#rival-select');
    const homeTeamSelect = document.querySelector('#home-team-select');
    const awayTeamSelect = document.querySelector('#away-team-select');
    const statsList = document.querySelector('#stats-list');
    const backToUploadButton = document.querySelector('#back-to-upload');
    const confirmButton = document.querySelector('#confirm-match');

    const successSummary = document.querySelector('#success-summary');
    const successNote = document.querySelector('#success-note');
    const registerAnotherButton = document.querySelector('#register-another-button');

    const state = {
        photoFile: null,
        photoUrl: null,
        analysis: null,
        analysisRequestId: 0,
        teamsRequestId: 0,
        teamGroups: [],
        teamsFailed: false,
        games: [],
        friends: [],
        currentUser: null
    };


    function showStep(stepName) {
        STEP_NAMES.forEach((name) => {
            steps[name].hidden = name !== stepName;
        });
    }

    function resetFlow() {
        state.analysisRequestId += 1;
        state.teamsRequestId += 1;
        state.analysis = null;
        clearPhoto();
        setUploadError('');
        clearErrors();
        showStep('upload');
    }

    function getErrorMessage(error, fallback) {
        const hasServerMessage = error && error.code && error.code !== 'HTTP_ERROR';
        return hasServerMessage ? error.message : fallback;
    }

    function readLastGameId() {
        try {
            return window.localStorage.getItem(LAST_GAME_STORAGE_KEY) || '';
        } catch (error) {
            return '';
        }
    }

    function saveLastGameId(gameId) {
        try {
            window.localStorage.setItem(LAST_GAME_STORAGE_KEY, gameId);
        } catch (error) {
            return;
        }
    }


    function getPhotoError(file) {
        if (!file.type.startsWith('image/')) {
            return 'El archivo debe ser una imagen (JPG, PNG, etc.).';
        }
        if (file.size > MAX_PHOTO_SIZE_BYTES) {
            return `La imagen pesa más de ${MAX_PHOTO_SIZE_MB} MB.`;
        }
        return '';
    }

    function setUploadError(message) {
        uploadError.textContent = message;
        uploadError.hidden = message === '';
    }

    function clearPhoto() {
        if (state.photoUrl) {
            URL.revokeObjectURL(state.photoUrl);
        }
        state.photoFile = null;
        state.photoUrl = null;
        photoInput.value = '';
        photoPreview.removeAttribute('src');
        photoPreview.hidden = true;
        dropzoneEmpty.hidden = false;
        dropzone.classList.remove('has-photo');
        analyzeButton.disabled = true;
    }

    function selectPhoto(file) {
        const error = getPhotoError(file);
        clearPhoto();

        if (error) {
            setUploadError(error);
            return;
        }

        setUploadError('');
        state.photoFile = file;
        state.photoUrl = URL.createObjectURL(file);
        photoPreview.src = state.photoUrl;
        photoPreview.hidden = false;
        dropzoneEmpty.hidden = true;
        dropzone.classList.add('has-photo');
        analyzeButton.disabled = false;
    }


    async function loadReferenceData() {
        const [games, friends, currentUser] = await Promise.all([
            api.games.getGames(),
            api.friends.getFriends(),
            api.session.getCurrentUser()
        ]);

        state.games = games;
        state.friends = friends;
        state.currentUser = currentUser;
    }

    async function analyzePhoto() {
        if (!state.photoFile) {
            return;
        }

        state.analysisRequestId += 1;
        const requestId = state.analysisRequestId;
        showStep('loading');

        try {
            const [analysis] = await Promise.all([
                api.analysis.analyzePhoto(state.photoFile),
                loadReferenceData()
            ]);

            if (requestId !== state.analysisRequestId) {
                return;
            }

            state.analysis = analysis;
            fillReviewFields();
            await fillTeamSelects();

            if (requestId !== state.analysisRequestId) {
                return;
            }
            showStep('review');
        } catch (error) {
            console.error('Error al analizar la foto:', error);

            if (requestId !== state.analysisRequestId) {
                return;
            }

            showStep('upload');
            setUploadError(getErrorMessage(error, 'No se pudo analizar la foto. Inténtalo de nuevo o sube otra imagen.'));
        }
    }


    function parseCount(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : null;
    }

    function isCount(value) {
        return Number.isInteger(value) && value >= 0;
    }

    function toId(value) {
        return value === '' ? null : Number(value);
    }

    function normalizeName(name) {
        return String(name || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }


    function fillSelect(select, placeholder, options) {
        select.replaceChildren(
            new Option(placeholder, ''),
            ...options.map(({ value, label }) => new Option(label, value))
        );
        select.disabled = false;
    }

    function fillGroupedSelect(select, placeholder, groups) {
        const optionGroups = groups.map((group) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.leagueName;
            optgroup.append(...group.teams.map((team) => new Option(team.name, team.id)));
            return optgroup;
        });

        select.replaceChildren(new Option(placeholder, ''), ...optionGroups);
        select.disabled = false;
    }

    function disableTeamSelects(message) {
        [homeTeamSelect, awayTeamSelect].forEach((select) => {
            select.replaceChildren(new Option(message, ''));
            select.disabled = true;
            select.classList.remove('needs-attention');
        });
    }

    function getAllTeams() {
        return state.teamGroups.flatMap((group) => group.teams);
    }

    function findTeam(detectedName, teams) {
        const wanted = normalizeName(detectedName);
        if (!wanted) {
            return null;
        }

        const exactMatch = teams.find((team) => normalizeName(team.name) === wanted);
        if (exactMatch) {
            return exactMatch;
        }

        const partialMatches = teams.filter((team) => {
            const candidate = normalizeName(team.name);
            return candidate.includes(wanted) || wanted.includes(candidate);
        });
        return partialMatches.length === 1 ? partialMatches[0] : null;
    }

    function selectDetectedTeam(select, detectedName, teams) {
        const team = findTeam(detectedName, teams);
        select.value = team ? String(team.id) : '';
    }

    function refreshTeamWarnings() {
        if (state.teamsFailed) {
            reviewNotice.hidden = false;
            reviewNotice.textContent = 'No se pudieron cargar los equipos de este juego. Elige otro juego y vuelve a elegir este para reintentar.';
            return;
        }

        const teamChecks = [
            { select: homeTeamSelect, side: 'local', detectedName: state.analysis.home_team },
            { select: awayTeamSelect, side: 'visitante', detectedName: state.analysis.away_team }
        ];
        const messages = [];

        teamChecks.forEach(({ select, side, detectedName }) => {
            const isMissing = select.value === '';
            select.classList.toggle('needs-attention', isMissing);
            if (isMissing) {
                messages.push(`No encontré al equipo ${side} (“${detectedName}”) en este juego.`);
            }
        });

        reviewNotice.hidden = messages.length === 0;
        reviewNotice.textContent = messages.length > 0
            ? `${messages.join(' ')} Elige el equipo correcto en la lista.`
            : '';
    }

    async function fillTeamSelects() {
        state.teamsRequestId += 1;
        const requestId = state.teamsRequestId;
        const gameId = gameSelect.value;

        state.teamGroups = [];
        state.teamsFailed = false;

        if (gameId === '') {
            disableTeamSelects('Elige primero el juego');
            refreshTeamWarnings();
            return;
        }

        disableTeamSelects('Cargando equipos...');

        try {
            const groups = await api.games.getTeamsOfGame(Number(gameId));

            if (requestId !== state.teamsRequestId) {
                return;
            }

            state.teamGroups = groups;
            fillGroupedSelect(homeTeamSelect, 'Elige el equipo local', groups);
            fillGroupedSelect(awayTeamSelect, 'Elige el equipo visitante', groups);

            const teams = getAllTeams();
            selectDetectedTeam(homeTeamSelect, state.analysis.home_team, teams);
            selectDetectedTeam(awayTeamSelect, state.analysis.away_team, teams);
        } catch (error) {
            console.error('Error al cargar los equipos:', error);

            if (requestId !== state.teamsRequestId) {
                return;
            }

            state.teamsFailed = true;
            disableTeamSelects('No se pudieron cargar los equipos');
        }

        refreshTeamWarnings();
    }

    function handleGameChange() {
        saveLastGameId(gameSelect.value);
        fillTeamSelects();
    }


    function setCountField(input, value) {
        const count = parseCount(value);
        input.value = count === null ? '' : String(count);
        input.classList.toggle('needs-attention', count === null);
    }

    function createStatInput(name, value, label, max) {
        const input = document.createElement('input');
        input.type = 'number';
        input.name = name;
        input.min = '0';
        input.step = '1';
        if (max !== undefined) {
            input.max = String(max);
        }
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('aria-label', label);
        setCountField(input, value);
        return input;
    }

    function createStatRow(stat, homeValue, awayValue) {
        const row = document.createElement('div');
        row.className = 'stat-row';

        const label = document.createElement('span');
        label.textContent = stat.label;

        row.append(
            createStatInput(`home_${stat.key}`, homeValue, `${stat.label} (local)`, stat.max),
            label,
            createStatInput(`away_${stat.key}`, awayValue, `${stat.label} (visitante)`, stat.max)
        );
        return row;
    }

    function renderStats(stats) {
        const rows = MATCH_STATS.map((stat) => createStatRow(
            stat,
            stats.home ? stats.home[stat.key] : null,
            stats.away ? stats.away[stat.key] : null
        ));
        statsList.replaceChildren(...rows);
    }


    function getInitialGameId() {
        const lastGameId = readLastGameId();
        const knownGame = state.games.find((game) => String(game.id) === lastGameId);

        if (knownGame) {
            return String(knownGame.id);
        }
        return state.games.length > 0 ? String(state.games[0].id) : '';
    }

    function fillReviewFields() {
        const fields = reviewForm.elements;
        const guestOption = { value: GUEST_VALUE, label: 'Invitado (sin cuenta)' };
        const friendOptions = state.friends.map((friend) => ({ value: friend.id, label: friend.nickname }));

        fillSelect(gameSelect, 'Elige el juego', state.games.map((game) => ({
            value: game.id,
            label: `${game.name} (${game.release_year})`
        })));
        gameSelect.value = getInitialGameId();

        fillSelect(rivalSelect, 'Elige a tu rival', [...friendOptions, guestOption]);

        reviewForm.querySelector('input[name="my_side"][value="home"]').checked = true;

        setCountField(fields.home_goals, state.analysis.home_goals);
        setCountField(fields.away_goals, state.analysis.away_goals);

        renderStats(state.analysis.stats || {});
        clearErrors();
    }


    function readNumber(fieldName) {
        const raw = reviewForm.elements[fieldName].value.trim();
        return raw === '' ? null : Number(raw);
    }

    function collectMatchData() {
        const fields = reviewForm.elements;
        const playedAsHome = reviewForm.querySelector('input[name="my_side"]:checked').value === 'home';
        const myId = state.currentUser.id;
        const rivalId = fields.rival_id.value === GUEST_VALUE ? null : toId(fields.rival_id.value);
        const stats = {};

        MATCH_STATS.forEach(({ key }) => {
            stats[`home_${key}`] = readNumber(`home_${key}`);
            stats[`away_${key}`] = readNumber(`away_${key}`);
        });

        return {
            home_user_id: playedAsHome ? myId : rivalId,
            away_user_id: playedAsHome ? rivalId : myId,
            home_team_game_id: toId(fields.home_team_game_id.value),
            away_team_game_id: toId(fields.away_team_game_id.value),
            home_goals: readNumber('home_goals'),
            away_goals: readNumber('away_goals'),
            stats
        };
    }

    function validateMatchData(data) {
        const fields = reviewForm.elements;
        const errors = [];
        const addError = (fieldNames, message) => errors.push({ fieldNames, message });

        if (fields.game_id.value === '') {
            addError(['game_id'], 'Elige el juego.');
        }
        if (fields.rival_id.value === '') {
            addError(['rival_id'], 'Elige a tu rival.');
        }
        if (data.home_team_game_id === null) {
            addError(['home_team_game_id'], 'Elige el equipo local.');
        }
        if (data.away_team_game_id === null) {
            addError(['away_team_game_id'], 'Elige el equipo visitante.');
        }

        const invalidGoalFields = ['home_goals', 'away_goals'].filter((name) => !isCount(data[name]));
        if (invalidGoalFields.length > 0) {
            addError(invalidGoalFields, 'Los goles deben ser números enteros de 0 o más.');
        }

        const invalidStatFields = Object.keys(data.stats).filter((name) => !isCount(data.stats[name]));
        if (invalidStatFields.length > 0) {
            addError(invalidStatFields, 'Completa todas las estadísticas con números enteros de 0 o más.');
        }

        const homePossession = data.stats.home_possession;
        const awayPossession = data.stats.away_possession;
        if (isCount(homePossession) && isCount(awayPossession) && homePossession + awayPossession !== 100) {
            addError(['home_possession', 'away_possession'], 'La posesión de ambos equipos debe sumar 100.');
        }

        [['home', 'del local'], ['away', 'del visitante']].forEach(([side, sideLabel]) => {
            const shots = data.stats[`${side}_shots`];
            const shotsOnTarget = data.stats[`${side}_shots_on_target`];
            if (isCount(shots) && isCount(shotsOnTarget) && shotsOnTarget > shots) {
                addError([`${side}_shots_on_target`], `Los disparos a puerta ${sideLabel} no pueden superar sus disparos totales.`);
            }
        });

        return errors;
    }

    function clearErrors() {
        reviewErrorsList.replaceChildren();
        reviewErrors.hidden = true;
        reviewForm.querySelectorAll('.is-invalid').forEach((element) => element.classList.remove('is-invalid'));
    }

    function showErrors(errors) {
        clearErrors();

        errors.forEach(({ fieldNames, message }) => {
            fieldNames.forEach((name) => reviewForm.elements[name].classList.add('is-invalid'));

            const item = document.createElement('li');
            item.textContent = message;
            reviewErrorsList.append(item);
        });

        reviewErrors.hidden = false;
        reviewErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearFieldFlags(event) {
        event.target.classList.remove('needs-attention', 'is-invalid');
    }

    function setConfirming(isConfirming) {
        confirmButton.disabled = isConfirming;
        confirmButton.textContent = isConfirming ? 'Enviando...' : 'Confirmar partido';
    }

    function buildSummary(data) {
        const homeName = homeTeamSelect.selectedOptions[0].text;
        const awayName = awayTeamSelect.selectedOptions[0].text;
        return `${homeName} ${data.home_goals} - ${data.away_goals} ${awayName}`;
    }

    function buildSuccessNote() {
        if (rivalSelect.value === GUEST_VALUE) {
            return '';
        }
        const rivalName = rivalSelect.selectedOptions[0].text;
        return `Le avisamos a ${rivalName}. El partido queda registrado cuando lo confirme.`;
    }

    function showSuccess(matchData) {
        const note = buildSuccessNote();

        successSummary.textContent = buildSummary(matchData);
        successNote.textContent = note;
        successNote.hidden = note === '';
        showStep('success');
    }

    async function handleReviewSubmit(event) {
        event.preventDefault();

        if (state.teamsFailed) {
            showErrors([{ fieldNames: [], message: 'No se pudieron cargar los equipos. Cambia de juego para reintentar.' }]);
            return;
        }

        const matchData = collectMatchData();
        const errors = validateMatchData(matchData);

        if (errors.length > 0) {
            showErrors(errors);
            return;
        }

        clearErrors();
        setConfirming(true);

        try {
            await api.matches.createMatch(matchData);
            showSuccess(matchData);
        } catch (error) {
            console.error('Error al enviar el partido:', error);
            showErrors([{ fieldNames: [], message: getErrorMessage(error, 'No se pudo enviar el partido. Inténtalo de nuevo.') }]);
        } finally {
            setConfirming(false);
        }
    }


    function openPhotoPicker() {
        photoInput.click();
    }

    function handleDropzoneKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPhotoPicker();
        }
    }

    function handlePhotoInputChange() {
        const file = photoInput.files[0];
        if (file) {
            selectPhoto(file);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        dropzone.classList.add('is-dragging');
    }

    function handleDragLeave() {
        dropzone.classList.remove('is-dragging');
    }

    function handleDrop(event) {
        event.preventDefault();
        dropzone.classList.remove('is-dragging');
        const file = event.dataTransfer.files[0];
        if (file) {
            selectPhoto(file);
        }
    }


    openRegisterLink.addEventListener('click', resetFlow);

    dropzone.addEventListener('click', openPhotoPicker);
    dropzone.addEventListener('keydown', handleDropzoneKeydown);
    dropzone.addEventListener('dragenter', handleDragOver);
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    photoInput.addEventListener('change', handlePhotoInputChange);
    analyzeButton.addEventListener('click', analyzePhoto);

    gameSelect.addEventListener('change', handleGameChange);
    homeTeamSelect.addEventListener('change', refreshTeamWarnings);
    awayTeamSelect.addEventListener('change', refreshTeamWarnings);
    reviewForm.addEventListener('input', clearFieldFlags);
    reviewForm.addEventListener('submit', handleReviewSubmit);
    backToUploadButton.addEventListener('click', () => showStep('upload'));

    registerAnotherButton.addEventListener('click', resetFlow);

    resetFlow();
})();
