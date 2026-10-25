// CREAMOS UNA FUNCION DE EJECUCION INMEDIATA, ES DECIR, QUE A LA QUE SE INTEGRA EL SCRIPT EN EL DOCUMENTO HTML
// YA COMIENZA A FUNCIONAR.
(function () {

    // CREAMOS UN ARRAY DE OBKETOS QUE VA A CONTENER LA CLAVE DE CADA ESTADISTICA Y EL NOMBRE QUE SE VA A MOSTRAR EN LA PAGINA PARA CADA UNO DE ELLOS,
    // ADEMAS TAMBIEN DE PODER PONERLES UN LIMITE (VALOR MAXIMO BASICAMENTE) EN CASO DE MODIFICAR LOS RESULTADOS SI ES QUE EL ESCANEO NO SURGE COMO CORRESPONDE.
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

    // AQUI DEFINIMOS UNA VARIABLE (ARRAY) QUE POSEE LOS 5 PASOS POR LOS QUE VA A PASAR EL FORMULARIO:
    // 1) SELECCION DE JUEGO Y JUGADORES
    // 2) SUBIDA DE LA FOTO
    // 3) CARGA / ANALISIS
    // 4) REVISION (DONDE EL USUARIO MODIFICA ALGUN PARAMETRO SI ES QUE SALIO MAL EL ESCANEO)
    // 5) FINALIZACION
    const STEP_NAMES = ['setup', 'upload', 'loading', 'review', 'success'];

    // AQUI DEFINIMOS EL TAMAÑO MAXIMO QUE DEBE TENER LA IMAGEN
    const MAX_PHOTO_SIZE_MB = 10;

    // CONVIERTE EL ARCHIVO A UN TAMAÑO DE BYTES PARA QUE SE PUEDA REPRESENTAR EN MEGABYTES
    const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

    // ESTA VARIABLE NOS DEJA REFERENCIAR AL USUARIO COMO INVITADO EN CASO DE QUE NO TENGA UNA CUENTA LOGUEADA O INICIADA LA SESION
    const GUEST_VALUE = 'guest';

    // ESTA ES LA CLAVE CON LA QUE SE VA A GUARDAR EL ULTIMO JUEGO QUE SE ESCANEO O SE SUBIO EN EL LOCALSTORAGE DEL NAVEGADOR
    const LAST_GAME_STORAGE_KEY = 'pesito:lastGameId';


    const api = window.matchApi || window.pesitoApi;

    // BOTONES QUE ABREN LA SECCION REGISTRAR PARTIDO
    const openRegisterLinks = document.querySelectorAll('#match-register, #match-register-mobile, #mm-register-first');

    // UN MINI ARRAY DE OBJETOS PARA MOSTRAR LOS PASOS QUE SE REALIZAN EN CADA ELEMENTO CORRESPONDIENTE DEL HTML
    const steps = {
        setup: document.querySelector('#step-setup'),
        upload: document.querySelector('#step-upload'),
        loading: document.querySelector('#step-loading'),
        review: document.querySelector('#step-review'),
        success: document.querySelector('#step-success')
    };

    // ---------------- SECCION DE CONFIGURACION PREVIA (JUEGO Y JUGADORES) -----------------
    const setupLoading = document.querySelector('#mr-setup-loading');
    const setupErrorCard = document.querySelector('#mr-setup-error');
    const setupErrorMessage = document.querySelector('#mr-setup-error-message');
    const setupRetryButton = document.querySelector('#mr-setup-retry-button');
    const teamsLoading = document.querySelector('#mr-teams-loading');

    const setupForm = document.querySelector('#setup-form');
    const setupGameSelect = document.querySelector('#setup-game-select');
    const setupHomePlayerSelect = document.querySelector('#setup-home-player-select');
    const setupAwayPlayerSelect = document.querySelector('#setup-away-player-select');
    const setupError = document.querySelector('#setup-error');
    const setupManualButton = document.querySelector('#setup-manual-button');
    const backToSetupButton = document.querySelector('#back-to-setup');

    // ---------------- SECCION DE SUBIDA DE FOTO -----------------
    // ESTA VARIABLE REFERENCIA AL ELEMENTO DEL HTML QUE RECIBE LA IMAGEN QUE LA IA ANALIZARA
    const photoInput = document.querySelector('#result-photo-input');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DONDE SE ARRASTRA LA IMAGEN
    const dropzone = document.querySelector('#dropzone');

    // ESTA VARIABLE REFERENCIA A LA ZONA VACIA DONDE SE ARRASTRA LA IMAGEN (AL CONTENEDOR BASICAMENTE)
    const dropzoneEmpty = document.querySelector('#dropzone-empty');

    // ESTA VARIABLE REFERENCIA A LA PREVISUALIZACION DE LA IMAGEN QUE EL USUARIO ADJUNTA
    const photoPreview = document.querySelector('#photo-preview');

    // ESTA VARIABLE REFERENCIA AL PARRAFO QUE SE MUESTRA SI ES QUE LA IMAGEN NO SE PUDO ANALIZAR POR ALGUN MOTIVO
    const uploadError = document.querySelector('#upload-error');

    // ESTA VARIABLE REFERENCIA AL BOTON QUE ANALIZA LOS RESULTADOS
    const analyzeButton = document.querySelector('#analyze-button');

    // ---------------- SECCION DE REVISION DE RESULTADOS -----------------

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DE LA REVISION DE RESULTADOS
    const reviewForm = document.querySelector('#review-form');

    const reviewNotice = document.querySelector('#review-notice');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DE LA LISTA DE ERRORES QUE PUEDE TENER EL CONTENEDOR DE LOS RESULTADOS
    const reviewErrors = document.querySelector('#review-errors');

    // ESTA VARIABLE REFERENCIA A LA LISTA DE LOS ERRORES
    const reviewErrorsList = document.querySelector('#review-errors-list');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DONDE ESTA EL INPUT PARA SELECCIONAR EL JUEGO ASOCIADO A LOS RESULTADOS
    const gameSelect = document.querySelector('#game-select');

    // SELECTORES DIRECTOS PARA JUGADOR LOCAL Y JUGADOR VISITANTE
    const homePlayerSelect = document.querySelector('#home-player-select');
    const awayPlayerSelect = document.querySelector('#away-player-select');

    // SUBSELECTORES DE LIGAS Y EQUIPOS
    const homeLeagueSelect = document.querySelector('#home-league-select');
    const homeTeamSelect = document.querySelector('#home-team-select');
    const awayLeagueSelect = document.querySelector('#away-league-select');
    const awayTeamSelect = document.querySelector('#away-team-select');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DONDE SE VAN A MOSTRAR LAS ESTADISTICAS DEL PARTIDO QUE EL USUARIO HA REGISTRADO
    const statsList = document.querySelector('#stats-list');

    // ESTA VARIABLE REFERENCIA AL BOTON POR EL CUAL SE PUEDE VOLVER A LA SUBIDA DE FOTO
    const backToUploadButton = document.querySelector('#back-to-upload');

    // ESTA VARIABLE REFERENCIA AL BOTON MEDIANTE EL CUAL SE REGISTRA EL PARTIDO ESCANEADO
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
        currentUser: null,
        setupHomePlayer: '',
        setupAwayPlayer: '',
        reviewHomePlayer: '',
        reviewAwayPlayer: ''
    };

    // Esta es una función que oculta o muestra los pasos de la pantalla comparando el nombre recibido con el nombre de cada paso.
    function showStep(stepName) {
        if (setupLoading) setupLoading.hidden = true;
        if (setupErrorCard) setupErrorCard.hidden = true;
        if (teamsLoading) teamsLoading.hidden = true;
        STEP_NAMES.forEach((name) => {
            if (steps[name]) {
                steps[name].hidden = name !== stepName;
            }
        });
    }

    // Muestra la pantalla de carga con spinner circular en el paso de configuración
    function showSetupLoading() {
        if (setupErrorCard) setupErrorCard.hidden = true;
        if (teamsLoading) teamsLoading.hidden = true;
        STEP_NAMES.forEach((name) => {
            if (steps[name]) steps[name].hidden = true;
        });
        if (setupLoading) setupLoading.hidden = false;
    }

    // Muestra la pantalla de carga con spinner circular al preparar los equipos para la carga manual
    function showTeamsLoading() {
        if (setupLoading) setupLoading.hidden = true;
        if (setupErrorCard) setupErrorCard.hidden = true;
        STEP_NAMES.forEach((name) => {
            if (steps[name]) steps[name].hidden = true;
        });
        if (teamsLoading) teamsLoading.hidden = false;
    }

    // Muestra la pantalla de error en el paso de configuración con opción de reintentar
    function showSetupError(message) {
        if (setupLoading) setupLoading.hidden = true;
        if (teamsLoading) teamsLoading.hidden = true;
        STEP_NAMES.forEach((name) => {
            if (steps[name]) steps[name].hidden = true;
        });
        if (setupErrorMessage) {
            setupErrorMessage.textContent = message || 'Hubo un problema al cargar los juegos y amigos. Inténtalo de nuevo.';
        }
        if (setupErrorCard) setupErrorCard.hidden = false;
    }

    // Reinicia el flujo completo: borra el análisis, limpia errores, limpia la foto y muestra la pantalla de configuración inicial.
    async function resetFlow() {
        state.analysisRequestId += 1;
        state.teamsRequestId += 1;
        state.analysis = null;
        clearPhoto();
        setUploadError('');
        setSetupError('');
        clearErrors();
        await initSetupStep();
    }

    // Evalúa un objeto de error retornado por el servidor y extrae el mensaje descriptivo si existe; de lo contrario, devuelve un mensaje por defecto (fallback).
    function getErrorMessage(error, fallback) {
        const hasServerMessage = error && error.code && error.code !== 'HTTP_ERROR';
        return hasServerMessage ? error.message : fallback;
    }

    // Intenta leer la clave del último juego guardado en el localStorage del navegador y retorna una cadena vacía si falla o no existe.
    function readLastGameId() {
        try {
            return window.localStorage.getItem(LAST_GAME_STORAGE_KEY) || '';
        } catch (error) {
            return '';
        }
    }

    // Intenta guardar el ID del juego seleccionado en la memoria persistente del navegador (localStorage).
    function saveLastGameId(gameId) {
        try {
            window.localStorage.setItem(LAST_GAME_STORAGE_KEY, gameId);
        } catch (error) {
            return;
        }
    }

    // Esta funcion comprueba que el usuario no suba nada mas que no sea una imagen JPG, PNG, o mas, y de que no sea pesada obviamente.
    function getPhotoError(file) {
        if (!file.type.startsWith('image/')) {
            return 'El archivo debe ser una imagen (JPG, PNG, etc.).';
        }
        if (file.size > MAX_PHOTO_SIZE_BYTES) {
            return `La imagen pesa más de ${MAX_PHOTO_SIZE_MB} MB.`;
        }
        return '';
    }

    // Escribe el mensaje de error de subida en la pantalla y oculta la etiqueta si el texto está vacío.
    function setUploadError(message) {
        uploadError.textContent = message;
        uploadError.hidden = message === '';
    }

    // Escribe el mensaje de error de configuración previa y oculta la etiqueta si el texto está vacío.
    function setSetupError(message) {
        setupError.textContent = message;
        setupError.hidden = message === '';
    }

    // Borra la imagen seleccionada liberando la memoria del navegador, resetea la vista previa, desactiva el botón de analizar y restablece la caja vacía.
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

    // Procesa un archivo seleccionado: si hay errores los muestra; si es válido, genera una URL temporal para previsualizarlo en pantalla y habilita el botón de analizar.
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

    // Realiza de forma paralela tres peticiones asíncronas a la API para obtener los juegos, la lista de amigos y los datos del usuario logueado, guardándolos en el objeto state.
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

    // Garantiza que los datos de referencia (juegos, amigos, usuario) estén cargados antes de interactuar con ellos.
    async function ensureReferenceData() {
        if (!state.currentUser || state.games.length === 0) {
            await loadReferenceData();
        }
    }

    // Genera la lista de opciones para los desplegables de jugadores (Usuario logueado, Amigos e Invitado).
    function buildPlayerOptions() {
        const myOption = state.currentUser
            ? [{ value: String(state.currentUser.id), label: `${state.currentUser.nickname} (Yo)` }]
            : [];
        const friendOptions = state.friends.map((friend) => ({
            value: String(friend.id),
            label: friend.nickname
        }));
        const guestOption = { value: GUEST_VALUE, label: 'Invitado (sin cuenta)' };

        return [...myOption, ...friendOptions, guestOption];
    }

    // Rellena los selectores del paso inicial de configuración (juego y jugadores local/visitante).
    function fillSetupFields() {
        fillSelect(setupGameSelect, 'Elige el juego', state.games.map((game) => ({
            value: String(game.id),
            label: `${game.name}`
        })));
        setupGameSelect.value = getInitialGameId();

        const playerOptions = buildPlayerOptions();
        fillSelect(setupHomePlayerSelect, 'Elige jugador local', playerOptions);
        fillSelect(setupAwayPlayerSelect, 'Elige jugador visitante', playerOptions);

        if (state.currentUser) {
            setupHomePlayerSelect.value = String(state.currentUser.id);
        }
        updateSetupPlayerStored();
    }

    // Actualiza los valores previos guardados de los jugadores en el paso inicial
    function updateSetupPlayerStored() {
        state.setupHomePlayer = setupHomePlayerSelect ? setupHomePlayerSelect.value : '';
        state.setupAwayPlayer = setupAwayPlayerSelect ? setupAwayPlayerSelect.value : '';
    }

    // Actualiza los valores previos guardados de los jugadores en el paso de revisión
    function updateReviewPlayerStored() {
        state.reviewHomePlayer = homePlayerSelect ? homePlayerSelect.value : '';
        state.reviewAwayPlayer = awayPlayerSelect ? awayPlayerSelect.value : '';
    }

    // Invierte los jugadores si se selecciona en un lado el que ya estaba en el otro
    function handlePlayerSelectChange(changedSelect, otherSelect, getPrevChanged, updateStoredCallback, onInvertCallback) {
        const newValue = changedSelect.value;
        const otherValue = otherSelect.value;

        if (newValue && newValue === otherValue) {
            const previousValueOfChanged = getPrevChanged();
            otherSelect.value = (previousValueOfChanged && previousValueOfChanged !== newValue)
                ? previousValueOfChanged
                : '';
        }

        updateStoredCallback();
        if (onInvertCallback) {
            onInvertCallback();
        }
    }

    function handleSetupHomePlayerChange() {
        handlePlayerSelectChange(
            setupHomePlayerSelect,
            setupAwayPlayerSelect,
            () => state.setupHomePlayer,
            updateSetupPlayerStored,
            () => {
                if (homePlayerSelect) homePlayerSelect.value = setupHomePlayerSelect.value;
                if (awayPlayerSelect) awayPlayerSelect.value = setupAwayPlayerSelect.value;
                updateReviewPlayerStored();
            }
        );
    }

    function handleSetupAwayPlayerChange() {
        handlePlayerSelectChange(
            setupAwayPlayerSelect,
            setupHomePlayerSelect,
            () => state.setupAwayPlayer,
            updateSetupPlayerStored,
            () => {
                if (homePlayerSelect) homePlayerSelect.value = setupHomePlayerSelect.value;
                if (awayPlayerSelect) awayPlayerSelect.value = setupAwayPlayerSelect.value;
                updateReviewPlayerStored();
            }
        );
    }

    function handleReviewHomePlayerChange() {
        handlePlayerSelectChange(
            homePlayerSelect,
            awayPlayerSelect,
            () => state.reviewHomePlayer,
            updateReviewPlayerStored,
            () => {
                if (setupHomePlayerSelect) setupHomePlayerSelect.value = homePlayerSelect.value;
                if (setupAwayPlayerSelect) setupAwayPlayerSelect.value = awayPlayerSelect.value;
                updateSetupPlayerStored();
            }
        );
        clearFieldFlags({ target: homePlayerSelect });
    }

    function handleReviewAwayPlayerChange() {
        handlePlayerSelectChange(
            awayPlayerSelect,
            homePlayerSelect,
            () => state.reviewAwayPlayer,
            updateReviewPlayerStored,
            () => {
                if (setupHomePlayerSelect) setupHomePlayerSelect.value = homePlayerSelect.value;
                if (setupAwayPlayerSelect) setupAwayPlayerSelect.value = awayPlayerSelect.value;
                updateSetupPlayerStored();
            }
        );
        clearFieldFlags({ target: awayPlayerSelect });
    }

    // Inicializa el paso 1 cargando los datos necesarios y rellenando los desplegables.
    async function initSetupStep() {
        setSetupError('');

        if (state.currentUser && state.games.length > 0) {
            fillSetupFields();
            showStep('setup');
            return;
        }

        showSetupLoading();
        try {
            await ensureReferenceData();
            fillSetupFields();
            showStep('setup');
        } catch (error) {
            console.error('Error al cargar datos de referencia:', error);
            showSetupError(getErrorMessage(error, 'No se pudieron cargar los juegos o amigos. Inténtalo de nuevo.'));
        }
    }

    // Valida que el juego y los dos jugadores estén seleccionados y no sean la misma cuenta de usuario.
    function validateSetup() {
        const gameId = setupGameSelect.value;
        const homeVal = setupHomePlayerSelect.value;
        const awayVal = setupAwayPlayerSelect.value;

        if (!gameId) {
            return 'Debes seleccionar el juego antes de continuar.';
        }
        if (!homeVal) {
            return 'Debes seleccionar el jugador local antes de continuar.';
        }
        if (!awayVal) {
            return 'Debes seleccionar el jugador visitante antes de continuar.';
        }
        if (homeVal !== GUEST_VALUE && homeVal === awayVal) {
            return 'El jugador local y visitante no pueden ser el mismo usuario.';
        }
        return '';
    }

    // Permite acceder al formulario de registro directamente sin usar la IA (carga manual).
    async function handleSetupManual() {
        setSetupError('');
        const error = validateSetup();
        if (error) {
            setSetupError(error);
            return;
        }

        saveLastGameId(setupGameSelect.value);
        state.analysis = null;
        fillReviewFields();

        showTeamsLoading();
        try {
            await fillTeamSelects();
            showStep('review');
        } catch (error) {
            console.error('Error al cargar equipos:', error);
            showStep('setup');
            setSetupError('No se pudieron cargar los equipos. Inténtalo de nuevo.');
        }
    }

    // Valida la selección del juego y de los jugadores en el paso inicial antes de avanzar a la subida de foto.
    function handleSetupSubmit(event) {
        event.preventDefault();
        setSetupError('');

        const error = validateSetup();
        if (error) {
            setSetupError(error);
            return;
        }

        saveLastGameId(setupGameSelect.value);
        showStep('upload');
    }

    // Envía la imagen al servidor pasando el ID del juego requerido para el análisis, rellena campos y pasa a la revisión.
    async function analyzePhoto() {
        if (!state.photoFile) {
            return;
        }

        const selectedGameId = setupGameSelect.value || gameSelect.value;
        const homeVal = setupHomePlayerSelect.value || homePlayerSelect.value;
        const awayVal = setupAwayPlayerSelect.value || awayPlayerSelect.value;

        if (!selectedGameId || !homeVal || !awayVal) {
            showStep('setup');
            setSetupError('No se puede analizar la foto sin antes haber seleccionado el juego y los jugadores.');
            return;
        }

        state.analysisRequestId += 1;
        const requestId = state.analysisRequestId;
        showStep('loading');

        try {
            const analysis = await api.analysis.analyzePhoto(state.photoFile, Number(selectedGameId));

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

    // Parsea una entrada de texto a un entero no negativo. Si la entrada está vacía, es inválida o es menor a cero, devuelve null.
    function parseCount(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : null;
    }

    // Devuelve verdadero sólo si el valor recibido es un número entero mayor o igual a cero.
    function isCount(value) {
        return Number.isInteger(value) && value >= 0;
    }

    // Convierte el valor de un select a un entero numérico o a null si está vacío.
    function toId(value) {
        return value === '' ? null : Number(value);
    }

    // Normaliza nombres de equipos retirando tildes, caracteres especiales y convirtiéndolos a minúsculas para facilitar las comparaciones.
    function normalizeName(name) {
        return String(name || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }

    // Llena un menú desplegable <select> con un texto comodín predeterminado y la lista de opciones recibida.
    function fillSelect(select, placeholder, options) {
        if (!select) return;
        select.replaceChildren(
            new Option(placeholder, ''),
            ...options.map(({ value, label }) => new Option(label, value))
        );
        select.disabled = false;
    }

    // Rellena un menú desplegable <select> agrupando los equipos por ligas utilizando etiquetas <optgroup>.
    function fillGroupedSelect(select, placeholder, groups) {
        if (!select) return;
        const optionGroups = groups.map((group) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.leagueName;
            optgroup.append(...group.teams.map((team) => new Option(team.name, team.id)));
            return optgroup;
        });

        select.replaceChildren(new Option(placeholder, ''), ...optionGroups);
        select.disabled = false;
    }

    // Llena el selector de ligas con la opción de todas y cada liga disponible.
    function populateLeagueSelect(select, groups) {
        if (!select) return;
        select.replaceChildren(
            new Option('Todas las ligas', ''),
            ...groups.map((group) => new Option(group.leagueName, String(group.leagueId ?? group.leagueName)))
        );
        select.disabled = false;
    }

    // Llena el selector de equipos, ya sea filtrado por una liga concreta o agrupando todas.
    function populateTeamSelect(select, groups, selectedLeagueKey, placeholder) {
        if (!select) return;

        if (!selectedLeagueKey) {
            fillGroupedSelect(select, placeholder, groups);
            return;
        }

        const group = groups.find((g) => String(g.leagueId ?? g.leagueName) === String(selectedLeagueKey));
        if (!group) {
            fillGroupedSelect(select, placeholder, groups);
            return;
        }

        select.replaceChildren(
            new Option(placeholder, ''),
            ...group.teams.map((team) => new Option(team.name, team.id))
        );
        select.disabled = false;
    }

    // Busca a qué liga pertenece un equipo dado su ID numérico.
    function findLeagueOfTeam(teamId, groups) {
        if (!teamId) return null;
        return groups.find((g) => g.teams.some((t) => String(t.id) === String(teamId))) || null;
    }

    // Deshabilita los selectores de equipos y ligas mostrando un mensaje temporal (por ejemplo "Cargando...").
    function disableTeamSelects(message) {
        [homeLeagueSelect, awayLeagueSelect].forEach((select) => {
            if (select) {
                select.replaceChildren(new Option(message, ''));
                select.disabled = true;
            }
        });
        [homeTeamSelect, awayTeamSelect].forEach((select) => {
            if (select) {
                select.replaceChildren(new Option(message, ''));
                select.disabled = true;
                select.classList.remove('needs-attention');
            }
        });
    }

    // Aplana la estructura de ligas para obtener una única lista simple con todos los equipos.
    function getAllTeams() {
        return state.teamGroups.flatMap((group) => group.teams);
    }

    // Intenta emparejar el nombre del equipo detectado en la foto con la lista oficial del juego.
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

    // Comprueba si los equipos detectados fueron asignados con éxito.
    function refreshTeamWarnings() {
        if (state.teamsFailed) {
            reviewNotice.hidden = false;
            reviewNotice.textContent = 'No se pudieron cargar los equipos de este juego. Elige otro juego y vuelve a elegir este para reintentar.';
            return;
        }

        if (!state.analysis) {
            reviewNotice.hidden = true;
            return;
        }

        const teams = getAllTeams();
        const teamChecks = [
            { select: homeTeamSelect, side: 'local', detectedName: state.analysis.home_team },
            { select: awayTeamSelect, side: 'visitante', detectedName: state.analysis.away_team }
        ];
        const messages = [];

        teamChecks.forEach(({ select, side, detectedName }) => {
            const isMissing = select.value === '';
            const matchExists = detectedName ? Boolean(findTeam(detectedName, teams)) : false;

            if (isMissing && detectedName && !matchExists) {
                select.classList.add('needs-attention');
                messages.push(`No encontré al equipo ${side} (“${detectedName}”) en este juego.`);
            } else if (!isMissing) {
                select.classList.remove('needs-attention');
            }
        });

        reviewNotice.hidden = messages.length === 0;
        reviewNotice.textContent = messages.length > 0
            ? `${messages.join(' ')} Elige el equipo correcto en la lista.`
            : '';
    }

    // Pide a la API la lista de equipos agrupados del juego seleccionado, los inserta en los selectores y auto-selecciona los equipos leídos de la foto si la IA fue usada.
    async function fillTeamSelects() {
        state.teamsRequestId += 1;
        const requestId = state.teamsRequestId;
        const gameId = gameSelect.value || setupGameSelect.value;

        state.teamGroups = [];
        state.teamsFailed = false;

        if (!gameId) {
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
            populateLeagueSelect(homeLeagueSelect, groups);
            populateLeagueSelect(awayLeagueSelect, groups);

            populateTeamSelect(homeTeamSelect, groups, '', 'Elige el equipo local');
            populateTeamSelect(awayTeamSelect, groups, '', 'Elige el equipo visitante');

            if (state.analysis) {
                const teams = getAllTeams();
                const homeMatch = findTeam(state.analysis.home_team, teams);
                const awayMatch = findTeam(state.analysis.away_team, teams);

                if (homeMatch) {
                    const league = findLeagueOfTeam(homeMatch.id, groups);
                    if (league) {
                        const leagueKey = String(league.leagueId ?? league.leagueName);
                        homeLeagueSelect.value = leagueKey;
                        populateTeamSelect(homeTeamSelect, groups, leagueKey, 'Elige el equipo local');
                    }
                    homeTeamSelect.value = String(homeMatch.id);
                }

                if (awayMatch) {
                    const league = findLeagueOfTeam(awayMatch.id, groups);
                    if (league) {
                        const leagueKey = String(league.leagueId ?? league.leagueName);
                        awayLeagueSelect.value = leagueKey;
                        populateTeamSelect(awayTeamSelect, groups, leagueKey, 'Elige el equipo visitante');
                    }
                    awayTeamSelect.value = String(awayMatch.id);
                }
            }
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

    // Evento ejecutado al cambiar la liga del local: filtra los equipos del local a esa liga
    function handleHomeLeagueChange() {
        const prevTeam = homeTeamSelect.value;
        const leagueKey = homeLeagueSelect.value;
        populateTeamSelect(homeTeamSelect, state.teamGroups, leagueKey, 'Elige el equipo local');

        const allTeamsInLeague = leagueKey
            ? (state.teamGroups.find((g) => String(g.leagueId ?? g.leagueName) === String(leagueKey))?.teams || [])
            : getAllTeams();

        if (allTeamsInLeague.some((t) => String(t.id) === String(prevTeam))) {
            homeTeamSelect.value = prevTeam;
        } else {
            homeTeamSelect.value = '';
        }
        refreshTeamWarnings();
    }

    // Evento ejecutado al cambiar la liga del visitante: filtra los equipos del visitante a esa liga
    function handleAwayLeagueChange() {
        const prevTeam = awayTeamSelect.value;
        const leagueKey = awayLeagueSelect.value;
        populateTeamSelect(awayTeamSelect, state.teamGroups, leagueKey, 'Elige el equipo visitante');

        const allTeamsInLeague = leagueKey
            ? (state.teamGroups.find((g) => String(g.leagueId ?? g.leagueName) === String(leagueKey))?.teams || [])
            : getAllTeams();

        if (allTeamsInLeague.some((t) => String(t.id) === String(prevTeam))) {
            awayTeamSelect.value = prevTeam;
        } else {
            awayTeamSelect.value = '';
        }
        refreshTeamWarnings();
    }

    // Sincroniza la liga seleccionada si el usuario elige un equipo desde "Todas las ligas"
    function handleHomeTeamChange() {
        if (homeTeamSelect.value && !homeLeagueSelect.value) {
            const league = findLeagueOfTeam(homeTeamSelect.value, state.teamGroups);
            if (league) {
                const leagueKey = String(league.leagueId ?? league.leagueName);
                const currentTeam = homeTeamSelect.value;
                homeLeagueSelect.value = leagueKey;
                populateTeamSelect(homeTeamSelect, state.teamGroups, leagueKey, 'Elige el equipo local');
                homeTeamSelect.value = currentTeam;
            }
        }
        refreshTeamWarnings();
    }

    function handleAwayTeamChange() {
        if (awayTeamSelect.value && !awayLeagueSelect.value) {
            const league = findLeagueOfTeam(awayTeamSelect.value, state.teamGroups);
            if (league) {
                const leagueKey = String(league.leagueId ?? league.leagueName);
                const currentTeam = awayTeamSelect.value;
                awayLeagueSelect.value = leagueKey;
                populateTeamSelect(awayTeamSelect, state.teamGroups, leagueKey, 'Elige el equipo visitante');
                awayTeamSelect.value = currentTeam;
            }
        }
        refreshTeamWarnings();
    }

    // Evento ejecutado al cambiar el juego: guarda la elección en localStorage, sincroniza el selector previo y vuelve a cargar los equipos.
    function handleGameChange() {
        saveLastGameId(gameSelect.value);
        if (setupGameSelect) {
            setupGameSelect.value = gameSelect.value;
        }
        fillTeamSelects();
    }

    // Asigna un valor numérico a un campo de entrada y le aplica una clase de atención visual si el valor es nulo o inválido.
    function setCountField(input, value) {
        const count = parseCount(value);
        input.value = count === null ? '' : String(count);
        input.classList.toggle('needs-attention', count === null);
    }

    // Crea dinámicamente un elemento <input> de tipo numérico para ingresar el valor de una estadística concreta.
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

    // Crea dinámicamente un elemento <input> de tipo numérico para ingresar el valor de una estadística concreta.
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

    // Genera e inserta en el contenedor principal todas las filas de estadísticas definidas en el arreglo MATCH_STATS.
    function renderStats(stats) {
        const rows = MATCH_STATS.map((stat) => createStatRow(
            stat,
            stats.home ? stats.home[stat.key] : null,
            stats.away ? stats.away[stat.key] : null
        ));
        statsList.replaceChildren(...rows);
    }

    // Obtiene el ID del juego inicial a seleccionar, priorizando la última elección guardada en localStorage o el primer juego disponible.
    function getInitialGameId() {
        const lastGameId = readLastGameId();
        const knownGame = state.games.find((game) => String(game.id) === lastGameId);

        if (knownGame) {
            return String(knownGame.id);
        }
        return state.games.length > 0 ? String(state.games[0].id) : '';
    }

    // Rellena los selectores de juego y jugadores en la pantalla de revisión, sincronizados con lo elegido en el paso 1.
    function fillReviewFields() {
        const fields = reviewForm.elements;

        fillSelect(gameSelect, 'Elige el juego', state.games.map((game) => ({
            value: String(game.id),
            label: `${game.name}`
        })));
        gameSelect.value = setupGameSelect.value || getInitialGameId();

        const playerOptions = buildPlayerOptions();
        fillSelect(homePlayerSelect, 'Elige jugador local', playerOptions);
        fillSelect(awayPlayerSelect, 'Elige jugador visitante', playerOptions);

        homePlayerSelect.value = setupHomePlayerSelect.value;
        awayPlayerSelect.value = setupAwayPlayerSelect.value;
        updateReviewPlayerStored();

        if (state.analysis) {
            setCountField(fields.home_goals, state.analysis.home_goals);
            setCountField(fields.away_goals, state.analysis.away_goals);
            renderStats(state.analysis.stats || {});
        } else {
            fields.home_goals.value = '';
            fields.away_goals.value = '';
            renderStats({});
        }

        clearErrors();
    }

    // Lee el valor escrito en un campo del formulario, lo limpia de espacios y lo retorna como número o null.
    function readNumber(fieldName) {
        const raw = reviewForm.elements[fieldName].value.trim();
        return raw === '' ? null : Number(raw);
    }

    // Recolecta todos los datos ingresados en el formulario y los estructura para la API del servidor.
    function collectMatchData() {
        const fields = reviewForm.elements;
        const homeVal = fields.home_player_id.value;
        const awayVal = fields.away_player_id.value;
        const stats = {};

        MATCH_STATS.forEach(({ key }) => {
            stats[`home_${key}`] = readNumber(`home_${key}`);
            stats[`away_${key}`] = readNumber(`away_${key}`);
        });

        return {
            home_user_id: homeVal === GUEST_VALUE ? null : toId(homeVal),
            away_user_id: awayVal === GUEST_VALUE ? null : toId(awayVal),
            home_team_game_id: toId(fields.home_team_game_id.value),
            away_team_game_id: toId(fields.away_team_game_id.value),
            home_goals: readNumber('home_goals'),
            away_goals: readNumber('away_goals'),
            stats
        };
    }

    // Ejecuta las reglas de validación de negocio.
    function validateMatchData(data) {
        const fields = reviewForm.elements;
        const errors = [];
        const addError = (fieldNames, message) => errors.push({ fieldNames, message });

        if (fields.game_id.value === '') {
            addError(['game_id'], 'Elige el juego.');
        }
        if (fields.home_player_id.value === '') {
            addError(['home_player_id'], 'Elige el jugador local.');
        }
        if (fields.away_player_id.value === '') {
            addError(['away_player_id'], 'Elige el jugador visitante.');
        }
        if (fields.home_player_id.value !== '' &&
            fields.home_player_id.value !== GUEST_VALUE &&
            fields.home_player_id.value === fields.away_player_id.value) {
            addError(['home_player_id', 'away_player_id'], 'El jugador local y visitante no pueden ser el mismo usuario.');
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

        const invalidStatFields = Object.keys(data.stats).filter((name) => {
            const val = data.stats[name];
            return val !== null && !isCount(val);
        });
        if (invalidStatFields.length > 0) {
            addError(invalidStatFields, 'Las estadísticas deben ser números enteros de 0 o más.');
        }

        const homePossession = data.stats.home_possession;
        const awayPossession = data.stats.away_possession;
        if (homePossession !== null || awayPossession !== null) {
            if (!isCount(homePossession) || !isCount(awayPossession)) {
                addError(['home_possession', 'away_possession'], 'Si indicas la posesión, debes completar ambos equipos.');
            } else if (homePossession + awayPossession !== 100) {
                addError(['home_possession', 'away_possession'], 'La posesión de ambos equipos debe sumar 100.');
            }
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

    // Esta funcion solamente elimina todo rastro de aviso de errores.
    function clearErrors() {
        reviewErrorsList.replaceChildren();
        reviewErrors.hidden = true;
        reviewForm.querySelectorAll('.is-invalid').forEach((element) => element.classList.remove('is-invalid'));
    }

    // Esta funcion muestra todos los errores en los campos del formulario de registro de partido
    function showErrors(errors) {
        clearErrors();

        errors.forEach(({ fieldNames, message }) => {
            fieldNames.forEach((name) => {
                if (reviewForm.elements[name]) {
                    reviewForm.elements[name].classList.add('is-invalid');
                }
            });

            const item = document.createElement('li');
            item.textContent = message;
            reviewErrorsList.append(item);
        });

        reviewErrors.hidden = false;
        reviewErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Quita las marcas de advertencia e invalidez de un campo tan pronto como el usuario empieza a escribir o modificar su contenido.
    function clearFieldFlags(event) {
        event.target.classList.remove('needs-attention', 'is-invalid');
    }

    // Deshabilita el botón de confirmar y cambia su texto a "Enviando..." para evitar dobles clics mientras se realiza la petición al servidor.
    function setConfirming(isConfirming) {
        confirmButton.disabled = isConfirming;
        confirmButton.textContent = isConfirming ? 'Enviando...' : 'Confirmar partido';
    }

    // Construye una cadena de texto formateada con el resultado final (ejemplo: "Real Madrid 2 - 1 FC Barcelona").
    function buildSummary(data) {
        const homeName = homeTeamSelect.selectedOptions[0].text;
        const awayName = awayTeamSelect.selectedOptions[0].text;
        return `${homeName} ${data.home_goals} - ${data.away_goals} ${awayName}`;
    }

    // Genera una nota informativa si el rival es un usuario registrado avisando que debe confirmar la solicitud.
    function buildSuccessNote() {
        const fields = reviewForm.elements;
        const myId = state.currentUser ? String(state.currentUser.id) : null;
        const homeVal = fields.home_player_id.value;
        const awayVal = fields.away_player_id.value;

        let rivalOption = null;
        if (homeVal !== myId && homeVal !== GUEST_VALUE && homeVal !== '') {
            rivalOption = fields.home_player_id;
        } else if (awayVal !== myId && awayVal !== GUEST_VALUE && awayVal !== '') {
            rivalOption = fields.away_player_id;
        }

        if (!rivalOption || !rivalOption.selectedOptions || !rivalOption.selectedOptions[0]) {
            return '';
        }
        const rivalName = rivalOption.selectedOptions[0].text;
        return `Le avisamos a ${rivalName}. El partido queda registrado cuando lo confirme.`;
    }

    // Muestra la vista final de éxito configurando los textos del resultado y la nota aclaratoria.
    function showSuccess(matchData) {
        const note = buildSuccessNote();

        successSummary.textContent = buildSummary(matchData);
        successNote.textContent = note;
        successNote.hidden = note === '';
        showStep('success');
    }

    // Manejador del evento submit del formulario: valida los datos, previene el envío normal del formulario y envía los datos a la API mediante api.matches.createMatch.
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

    // Simula un clic en el <input type="file"> oculto para abrir el explorador de archivos del sistema operativo.
    function openPhotoPicker() {
        photoInput.click();
    }

    // Permite abrir el selector de fotos usando el teclado presionado Enter o la barra espaciadora en la dropzone para accesibilidad.
    function handleDropzoneKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPhotoPicker();
        }
    }

    // Captura el archivo elegido cuando cambia el estado del <input type="file"> y lo manda a procesar.
    function handlePhotoInputChange() {
        const file = photoInput.files[0];
        if (file) {
            selectPhoto(file);
        }
    }

    // Activa el efecto visual de arrastre cuando el usuario sostiene un archivo sobre la zona de subida.
    function handleDragOver(event) {
        event.preventDefault();
        dropzone.classList.add('is-dragging');
    }

    //Desactiva el efecto visual de arrastre si el usuario saca el archivo de la zona sin soltarlo.
    function handleDragLeave() {
        dropzone.classList.remove('is-dragging');
    }

    // Captura el archivo cuando el usuario lo suelta físicamente sobre la dropzone y lo envía a la función selectPhoto.
    function handleDrop(event) {
        event.preventDefault();
        dropzone.classList.remove('is-dragging');
        const file = event.dataTransfer.files[0];
        if (file) {
            selectPhoto(file);
        }
    }

    // Escucha el clic para abrir el registro de partidos y resetea el formulario al estado inicial.
    openRegisterLinks.forEach((link) => {
        link.addEventListener('click', resetFlow);
    });

    // Escuchadores de eventos para la sección inicial (setup)
    if (setupForm) {
        setupForm.addEventListener('submit', handleSetupSubmit);
        setupForm.addEventListener('input', () => setSetupError(''));
    }
    if (setupManualButton) {
        setupManualButton.addEventListener('click', handleSetupManual);
    }
    if (setupGameSelect) {
        setupGameSelect.addEventListener('change', () => saveLastGameId(setupGameSelect.value));
    }
    if (setupHomePlayerSelect) {
        setupHomePlayerSelect.addEventListener('change', handleSetupHomePlayerChange);
    }
    if (setupAwayPlayerSelect) {
        setupAwayPlayerSelect.addEventListener('change', handleSetupAwayPlayerChange);
    }
    if (setupRetryButton) {
        setupRetryButton.addEventListener('click', initSetupStep);
    }
    if (backToSetupButton) {
        backToSetupButton.addEventListener('click', () => showStep('setup'));
    }

    // Asigna todos los eventos de interacción (clics, teclas, arrastre de archivos y clic en analizar) a la zona de carga de la imagen.
    dropzone.addEventListener('click', openPhotoPicker);
    dropzone.addEventListener('keydown', handleDropzoneKeydown);
    dropzone.addEventListener('dragenter', handleDragOver);
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    photoInput.addEventListener('change', handlePhotoInputChange);
    analyzeButton.addEventListener('click', analyzePhoto);

    // Registra los escuchadores de eventos para los selectores de juegos, ligas, equipos, inputs y envío del formulario.
    gameSelect.addEventListener('change', handleGameChange);
    if (homePlayerSelect) {
        homePlayerSelect.addEventListener('change', handleReviewHomePlayerChange);
    }
    if (awayPlayerSelect) {
        awayPlayerSelect.addEventListener('change', handleReviewAwayPlayerChange);
    }
    if (homeLeagueSelect) {
        homeLeagueSelect.addEventListener('change', handleHomeLeagueChange);
    }
    if (awayLeagueSelect) {
        awayLeagueSelect.addEventListener('change', handleAwayLeagueChange);
    }
    homeTeamSelect.addEventListener('change', handleHomeTeamChange);
    awayTeamSelect.addEventListener('change', handleAwayTeamChange);
    reviewForm.addEventListener('input', clearFieldFlags);
    reviewForm.addEventListener('submit', handleReviewSubmit);
    backToUploadButton.addEventListener('click', () => showStep('upload'));

    // Asigna el evento al botón de "Registrar otro partido" para volver a empezar el flujo completo.
    registerAnotherButton.addEventListener('click', resetFlow);

    // Ejecuta la función resetFlow() al cargar el script para garantizar que todo inicie limpio en el paso 1 y cierra la función autoejecutable.
    resetFlow();
})();
