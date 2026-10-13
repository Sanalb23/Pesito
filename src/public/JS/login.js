// --- 1. LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('https://pesito-ejyz.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Vital para que el navegador guarde la cookie de sesión
                body: JSON.stringify({ email, password })
            });

            const resultado = await response.json();

            if (response.ok) {
                alert("¡Login exitoso! Entrando al sistema...");
                window.location.href = "main.html"; // Cambialo por la ruta de tu menú principal cuando lo conectes
            } else {
                alert("Error: " + resultado.message);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor. (Recordá que Render puede tardar unos segundos en despertar si estaba inactivo).");
        }
    });
}

// --- 2. LÓGICA DE REGISTRO ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nickname = document.getElementById('regNickname').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validación casera para asegurarnos de que las contraseñas coincidan
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        try {
            const response = await fetch('https://pesito-ejyz.onrender.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nickname, email, password })
            });

            const resultado = await response.json();

            if (response.ok) {
                alert("¡Cuenta creada y sesión iniciada con éxito!");
                window.location.href = "menu.html";
            } else {
                alert("Error al registrarse: " + resultado.message);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
}