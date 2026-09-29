// ================================
// TRANSICION ENTRE SECCIONES DEL MENU (FADE-OUT / FADE-IN)
// ================================

// Debe coincidir con la duracion definida en la transicion CSS (0.4s)
const FADE_DURATION = 400;

// Elementos de cada "ventana" del menu
const mainMenu = document.querySelector('.main-menu-container');
const matchRegisterMenu = document.querySelector('.match-register-menu');
const matchRegisterContent = document.querySelector('.match-register-content');

// Botones que disparan el cambio
const matchRegisterBtn = document.querySelector('#match-register');
const backButton = document.querySelector('#back-to-menu');

/**
 * Cambia de una seccion a otra con fade-out + fade-in.
 *
 * hideEl / showEl        -> el elemento que tiene la clase "fade-out" (el que se ve, la tarjeta/contenido)
 * hideContainer / showContainer -> el elemento al que se le cambia el display (puede ser el mismo que hideEl/showEl,
 *                                   como pasa con mainMenu que es contenido y contenedor a la vez)
 */
function switchSections(hideEl, hideContainer, showEl, showContainer) {
    // 1. Fade-out de la seccion visible (esto SOLO anima la opacidad)
    hideEl.classList.add('fade-out');

    // 2. Esperamos a que termine la animacion de opacidad antes de sacarla
    //    de la pantalla. Si hicieramos display:none al mismo tiempo que
    //    opacity:0, el navegador ni siquiera llega a mostrar la animacion.
    setTimeout(() => {
        hideContainer.style.display = 'none';

        // 3. Mostramos el nuevo contenedor, pero arrancamos su contenido
        //    en opacidad 0 (le agregamos la misma clase fade-out)
        showContainer.style.display = 'flex';
        showEl.classList.add('fade-out');

        // 4. Forzamos un "reflow": le pedimos al navegador una propiedad
        //    (offsetWidth) para que aplique el estado "opacity: 0" antes
        //    de que le saquemos la clase. Sin esto, el navegador agrupa
        //    los dos cambios y no se ve el fade-in.
        void showEl.offsetWidth;

        // 5. Sacamos la clase -> como hay "transition: opacity" en el CSS,
        //    esto anima de 0 a 1 (fade-in)
        showEl.classList.remove('fade-out');
    }, FADE_DURATION);
}

// Ir de "Menu Principal" a "Registrar Partido"
matchRegisterBtn.addEventListener('click', () => {
    switchSections(mainMenu, mainMenu, matchRegisterContent, matchRegisterMenu);
});

// Volver de "Registrar Partido" a "Menu Principal"
if (backButton) {
    backButton.addEventListener('click', () => {
        switchSections(matchRegisterContent, matchRegisterMenu, mainMenu, mainMenu);
    });
}

// NOTA: "user-stats", "user-friends" y "log-out" todavia no tienen
// una seccion propia en el HTML. Cuando la agregues, podes reusar
// switchSections() exactamente igual que arriba.
