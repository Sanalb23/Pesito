const { rateLimit } = require('express-rate-limit');

/**
 * Limitador general de consultas para toda la API.
 * Permite hasta 100 peticiones cada 15 minutos por IP.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100, // Máximo 100 peticiones por ventana de tiempo por IP
    standardHeaders: 'draft-8', // Retorna encabezados estándar RateLimit-*
    legacyHeaders: false, // Deshabilita los encabezados obsoletos X-RateLimit-*
    message: {
        error: "TOO_MANY_REQUESTS",
        message: "Demasiadas peticiones desde esta IP. Por favor, intenta de nuevo más tarde."
    }
});

/**
 * Limitador estricto para rutas sensibles como autenticación (login, registro, etc.).
 * Permite hasta 10 intentos cada 15 minutos por IP para prevenir ataques de fuerza bruta.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 10, // Máximo 10 intentos por ventana de tiempo por IP
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Demasiados intentos de autenticación desde esta IP. Por favor, intenta de nuevo más tarde."
    }
});

module.exports = {
    generalLimiter,
    authLimiter
};
