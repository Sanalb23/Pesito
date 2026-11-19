// --- 1. LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = loginForm.querySelector('input[type="submit"]');
        const originalText = submitBtn ? submitBtn.value : 'Ingresar';

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Bloquear el botón al enviarse el formulario
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.value = 'Iniciando sesión...';
        }

        let responseOk = false;

        try {
            const response = await fetch('https://pesito-ejyz.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Vital para que el navegador guarde la cookie de sesión
                body: JSON.stringify({ email, password })
            });

            const resultado = await response.json();

            if (response.ok) {
                responseOk = true;
                window.location.href = "main.html"; // Cambialo por la ruta de tu menú principal cuando lo conectes
            } else {
                alert("Error: " + resultado.message);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor. (Recordá que Render puede tardar unos segundos en despertar si estaba inactivo).");
        } finally {
            // Se vuelve a habilitar el botón si la respuesta tuvo un error o si falló la conexión
            if (!responseOk && submitBtn) {
                submitBtn.disabled = false;
                submitBtn.value = originalText;
            }
        }
    });
}

// --- 2. LÓGICA DE REGISTRO ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = registerForm.querySelector('input[type="submit"]');
        const originalText = submitBtn ? submitBtn.value : 'Ingresar';

        const nickname = document.getElementById('regNickname').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validación casera para asegurarnos de que las contraseñas coincidan
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        // Bloquear el botón al enviarse el formulario
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.value = 'Registrando...';
        }

        let responseOk = false;

        try {
            const response = await fetch('https://pesito-ejyz.onrender.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nickname, email, password })
            });

            const resultado = await response.json();

            if (response.ok) {
                responseOk = true;
                alert("¡Cuenta creada y sesión iniciada con éxito!");
                window.location.href = "menu.html";
            } else {
                alert("Error al registrarse: " + resultado.message);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            // Se vuelve a habilitar el botón si la respuesta tuvo un error o si falló la conexión
            if (!responseOk && submitBtn) {
                submitBtn.disabled = false;
                submitBtn.value = originalText;
            }
        }
    });
}