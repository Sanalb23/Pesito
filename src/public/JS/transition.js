// ANIMACION DE TRANSICION (FADE-OUT / FADE-IN) ENTRE LOGIN Y REGISTRO
const toLoginLink = document.querySelector('#login-form');
const toRegisterLink = document.querySelector('#register-form');
const loginFrame = document.querySelector('.login-frame');
const registerSection = document.querySelector('.register-section');
const registerFrame = document.querySelector('.register-frame');

// Debe coincidir con la duracion definida en la transicion CSS (0.4s)
const FADE_DURATION = 400;

/**
 * Desvanece (fade-out) la tarjeta visible, la oculta,
 * muestra la otra tarjeta y la desvanece hacia adentro (fade-in).
 */
function switchForms(hideEl, hideContainer, showEl, showContainer) {
    // 1. Fade-out de la tarjeta actual
    hideEl.classList.add('fade-out');

    setTimeout(() => {
        // 2. Ocultamos por completo el contenedor anterior
        hideContainer.style.display = 'none';

        // 3. Mostramos el nuevo contenedor y preparamos su tarjeta en opacidad 0
        showContainer.style.display = 'flex';
        showEl.classList.add('fade-out');

        // Forzamos un reflow para que el navegador registre el estado
        // "opacidad 0" antes de quitarle la clase y animar el fade-in
        void showEl.offsetWidth;

        // 4. Fade-in de la nueva tarjeta
        showEl.classList.remove('fade-out');
    }, FADE_DURATION);
}

toRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchForms(loginFrame, loginFrame, registerFrame, registerSection);
});

if (toLoginLink) {
    toLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForms(registerFrame, registerSection, loginFrame, loginFrame);
    });
}