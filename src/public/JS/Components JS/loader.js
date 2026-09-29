// ================================
// LOADER AL INICIAR SESION / REGISTRARSE
// ================================
const loaderSection = document.querySelector('.loader');
const loginForm = loginFrame.querySelector('form');
const registerForm = registerFrame.querySelector('form');

/**
 * Validacion placeholder: chequea que los campos no esten vacios.
 * Reemplazar por la validacion real (fetch al backend, chequeo de
 * credenciales, etc.) cuando este conectado el login de verdad.
 */
function isFormValid(form) {
    const inputs = form.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    return Array.from(inputs).every((input) => input.value.trim() !== '');
}

function showLoader() {
    loaderSection.classList.add('onscreen');
}

/**
 * Hace fade-out de la tarjeta activa y, una vez terminada la
 * animacion, oculta su contenedor y muestra el loader.
 */
function goToLoader(activeFrame, activeContainer) {
    activeFrame.classList.add('fade-out');

    setTimeout(() => {
        activeContainer.style.display = 'none';
        showLoader();
    }, FADE_DURATION);
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isFormValid(loginForm)) return; // aca podrias mostrar un mensaje de error

    goToLoader(loginFrame, loginFrame);
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isFormValid(registerForm)) return; // aca podrias mostrar un mensaje de error

    goToLoader(registerFrame, registerSection);
});
