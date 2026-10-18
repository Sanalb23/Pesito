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

    // AQUI DEFINIMOS UNA VARIABLE (ARRAY) QUE POSEE LOS 4 PASOS POR LOS QUE VA A PASAR EL FORMULARIO:
    // 1) SUBIDA
    // 2) CARGA DEL ARCHIVO
    // 3) REVISION (DONDE EL USUARIO MODIFICA ALGUN PARAMETRO SI ES QUE SALIO MAL EL ESCANEO)
    // 4) FINALIZACION
    const STEP_NAMES = ['upload', 'loading', 'review', 'success'];

    // AQUI DEFINIMOS EL TAMAÑO MAXIMO QUE DEBE TENER LA IMAGEN
    const MAX_PHOTO_SIZE_MB = 10;

    // CONVIERTE EL ARCHIVO A UN TAMAÑO DE BYTES PARA QUE SE PUEDA REPRESENTAR EN MEGABYTES
    const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

    // ESTA VARIABLE NOS DEJA REFERENCIAR AL USUARIO COMO INVITADO EN CASO DE QUE NO TENGA UNA CUENTA LOGUEADA O INICIADA LA SESION
    const GUEST_VALUE = 'guest';

    // ESTA ES LA CLAVE CON LA QUE SE VA A GUARDAR EL ULTIMO JUEGO QUE SE ESCANEO O SE SUBIO EN EL LOCALSTORAGE DEL NAVEGADOR
    const LAST_GAME_STORAGE_KEY = 'pesito:lastGameId';


    const api = window.pesitoApi;

    // AGARRAMOS EL ELEMENTO MATCH-REGISTER DEL DOCUMENTO HTML
    const openRegisterLink = document.querySelector('#match-register');

    // UN MINI ARRAY DE OBJETOS PARA MOSTRAR LOS PASOS QUE SE REALIZAN EN CADA ELEMENTO CORRESPONDIENTE DEL HTML
    const steps = {
        upload: document.querySelector('#step-upload'),
        loading: document.querySelector('#step-loading'),
        review: document.querySelector('#step-review'),
        success: document.querySelector('#step-success')
    };
    
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

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DE LA REVISION DE RESULTADOS (EL CONTENEODR GENERAL ME REFIERO, O SEA LA CARD XD)
    const reviewForm = document.querySelector('#review-form');

    // HONESTAMENTE NO TENGO IDEA DE QUE ES ESTA VARIABLE XDD
    const reviewNotice = document.querySelector('#review-notice');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DE LA LISTA DE ERRORES QUE PUEDE TENER EL CONTENEDOR DE LOS RESULTADOS
    const reviewErrors = document.querySelector('#review-errors');

    // ESTA VARIABLE REFERENCIA A LA LISTA DE LOS ERRORES
    const reviewErrorsList = document.querySelector('#review-errors-list');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DONDE ESTA EL INPUT PARA SELECCIONAR EL JUEGO ASOCIADO A LOS RESULTADOS QUE EL USUARIO A SUBIDO
    const gameSelect = document.querySelector('#game-select');

    // ESTA VARIABLE REFERENCIA AL INPUT PARA SELECCIONAR EL USUARIO CONTRA EL QUE SE HA JUGADO EL PARTIDO
    const rivalSelect = document.querySelector('#rival-select');

    // ESTA VARIABLE REFERENCIA AL INPUT DONDE SE SELECCIONA EL EQUIPO LOCAL
    const homeTeamSelect = document.querySelector('#home-team-select');

    // ESTA VARIABLE REFERENCIA AL INPUT DONDE SE SELECCION EL EQUIPO VISITANTE
    const awayTeamSelect = document.querySelector('#away-team-select');

    // ESTA VARIABLE REFERENCIA AL CONTENEDOR DONDE SE VAN A MOSTRAR LAS ESTADISTICAS DEL PARTIDO QUE EL USUARIO HA REGISTRADO
    const statsList = document.querySelector('#stats-list');

    // ESTA VARIABLE REFERENCIA AL BOTON POR EL CUAL SE PUEDEN VOLVER A AGREGAR UNA IMAGEN LA CUAL EL USUARIO HAYA CONFUNDIDO-
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
        currentUser: null
    };

    // Esta es una función que oculta o muestra los cuatro pasos de la pantalla comparando el nombre recibido con el nombre de cada paso.
    function showStep(stepName) {
        STEP_NAMES.forEach((name) => {
            steps[name].hidden = name !== stepName;
        });
    }

    // Reinicia el flujo completo: incrementa los contadores de peticiones para cancelar llamadas previas, borra el análisis, limpia errores, limpia la foto y muestra la pantalla inicial de subida.
    function resetFlow() {
        state.analysisRequestId += 1;
        state.teamsRequestId += 1;
        state.analysis = null;
        clearPhoto();
        setUploadError('');
        clearErrors();
        showStep('upload');
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

    // Envía la imagen al servidor para ser analizada mientras carga los datos de referencia. Controla cancelaciones si el usuario reintenta en el medio y pasa al paso de revisión rellenando los campos automáticamente.
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
        select.replaceChildren(
            new Option(placeholder, ''),
            ...options.map(({ value, label }) => new Option(label, value))
        );
        select.disabled = false;
    }

    // Rellena un menú desplegable <select> agrupando los equipos por ligas utilizando etiquetas <optgroup>.
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

    // Deshabilita los selectores de equipos local y visitante mostrando un mensaje temporal (por ejemplo "Cargando...").
    function disableTeamSelects(message) {
        [homeTeamSelect, awayTeamSelect].forEach((select) => {
            select.replaceChildren(new Option(message, ''));
            select.disabled = true;
            select.classList.remove('needs-attention');
        });
    }

    // Aplana la estructura de ligas para obtener una única lista simple con todos los equipos.
    function getAllTeams() {
        return state.teamGroups.flatMap((group) => group.teams);
    }

    // Intenta emparejar el nombre del equipo detectado en la foto con la lista oficial del juego, buscando primero coincidencias exactas y luego parciales.
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

    // Selecciona automáticamente en el <select> el ID del equipo que fue detectado en la foto.
    function selectDetectedTeam(select, detectedName, teams) {
        const team = findTeam(detectedName, teams);
        select.value = team ? String(team.id) : '';
    }

    // Comprueba si los equipos detectados fueron asignados con éxito. Si falta alguno, resalta el campo y genera un aviso de advertencia para el usuario.
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

    // Pide a la API la lista de equipos agrupados del juego seleccionado, los inserta en los selectores y auto-selecciona los equipos leídos de la foto.
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

    // Evento ejecutado al cambiar el juego: guarda la elección en localStorage y vuelve a cargar los equipos asociados correspondientes a ese juego.
    function handleGameChange() {
        saveLastGameId(gameSelect.value);
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

    // Rellena los selectores de juegos y rivales (incluyendo la opción de invitado), marca al usuario como local por defecto y asigna los goles y estadísticas leídos de la foto.
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

    // Lee el valor escrito en un campo del formulario, lo limpia de espacios y lo retorna como número o null.
    function readNumber(fieldName) {
        const raw = reviewForm.elements[fieldName].value.trim();
        return raw === '' ? null : Number(raw);
    }

    // Recolecta todos los datos ingresados en el formulario y los estructura exactamente en el formato JSON que exige la API del servidor para guardar un partido.
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

    // Ejecuta las reglas de validación de negocio (campos vacíos, números válidos, que la posesión sume 100% y que los tiros a puerta no superen los tiros totales) acumulando los errores encontrados.
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
            fieldNames.forEach((name) => reviewForm.elements[name].classList.add('is-invalid'));

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
        if (rivalSelect.value === GUEST_VALUE) {
            return '';
        }
        const rivalName = rivalSelect.selectedOptions[0].text;
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
    openRegisterLink.addEventListener('click', resetFlow);

    // Asigna todos los eventos de interacción (clics, teclas, arrastre de archivos y clic en analizar) a la zona de carga de la imagen.
    dropzone.addEventListener('click', openPhotoPicker);
    dropzone.addEventListener('keydown', handleDropzoneKeydown);
    dropzone.addEventListener('dragenter', handleDragOver);
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    photoInput.addEventListener('change', handlePhotoInputChange);
    analyzeButton.addEventListener('click', analyzePhoto);

    // Registra los escuchadores de eventos para los selectores de juegos, equipos, la limpieza de errores al modificar inputs, la navegación hacia atrás y el envío final del formulario.
    gameSelect.addEventListener('change', handleGameChange);
    homeTeamSelect.addEventListener('change', refreshTeamWarnings);
    awayTeamSelect.addEventListener('change', refreshTeamWarnings);
    reviewForm.addEventListener('input', clearFieldFlags);
    reviewForm.addEventListener('submit', handleReviewSubmit);
    backToUploadButton.addEventListener('click', () => showStep('upload'));

    // Asigna el evento al botón de "Registrar otro partido" para volver a empezar el flujo completo.
    registerAnotherButton.addEventListener('click', resetFlow);

    // Ejecuta la función resetFlow() al cargar el script para garantizar que todo inicie limpio en el paso 1 y cierra la función autoejecutable.
    resetFlow();
})();
