// Validación de sesión
try {
    const response = await fetch('https://pesito-ejyz.onrender.com/users/me', {
        method: 'GET',
        credentials: 'include'
    });

    // Si el token es inválido, expiró o no existe la sesión, el servidor responde 401 o 403
    if (response.status === 401 || response.status === 403) {
        window.location.href = 'index.html';
    }
} catch (error) {
    alert('Error al verificar sesión con el servidor:', error);
    window.location.href = 'index.html';
}