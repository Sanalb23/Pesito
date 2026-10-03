const bcrypt = require('bcryptjs');
const usersModel = require('../models/user.model');
const { createToken, createRefreshToken, verifyRefreshToken } = require('../middlewares/auth');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
};

const register = async (req, res) => {
    try {
        const { nickname, email, password } = req.body;

        if (password.length < 8 || password.length > 12) {
            return res.status(400).json({ error: "INVALID_PASSWORD", message: "La contraseña debe tener entre 8 y 12 caracteres" });
        }

        if (nickname.includes(' ')) {
            return res.status(400).json({ error: "INVALID_NICKNAME", message: "El nickname no debe contener espacios" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await usersModel.create(nickname, email, hashedPassword);

        setAccessToken(res, newUser.id);
        setRefreshToken(res, newUser.id);

        res.status(201).json({ message: "Usuario registrado exitosamente", data: newUser });
    } catch (error) {
        if (error.code === '23505') {
            if (error.constraint === 'users_email_key') {
                return res.status(400).json({ error: "EMAIL_IN_USE", message: "El email ya está en uso" });
            }

            if (error.constraint === 'users_nickname_key') {
                return res.status(400).json({ error: "NICKNAME_IN_USE", message: "El nickname ya está en uso" });
            }
        }

        res.status(500).json({ error: "REGISTER_ERROR", message: "Error al registrar el usuario" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await usersModel.findByEmail(email);

        if (!userExists) {
            return res.status(400).json({ error: "USER_NOT_FOUND", message: "El usuario no existe" });
        }

        const isPasswordValid = await bcrypt.compare(password, userExists.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "INVALID_PASSWORD", message: "Contraseña incorrecta" });
        }

        delete userExists.password;

        setAccessToken(res, userExists.id);
        setRefreshToken(res, userExists.id);

        res.status(200).json({ message: "Login exitoso", data: userExists });
    } catch (error) {
        res.status(500).json({ error: "LOGIN_ERROR", message: "Error al iniciar sesión" });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('access_token', cookieOptions);
        res.clearCookie('refresh_token', cookieOptions);

        res.status(200).json({ message: 'Se ha cerrado sesión correctamente' });
    } catch (error) {
        res.status(500).json({ error: "LOGOUT_ERROR", message: "Error al cerrar sesión" });
    }
}

const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refresh_token;

        if (!token) {
            return res.status(401).json({ error: "MISSING_REFRESH_TOKEN", message: 'Refresh Token no proporcionado' });
        }

        const decoded = verifyRefreshToken(token);

        const userExists = await usersModel.findById(decoded.id);

        if (!userExists) {
            return res.status(404).json({ error: "USER_NOT_FOUND", message: 'Usuario no encontrado' });
        }

        setAccessToken(res, userExists.id);

        return res.status(200).json({ message: 'Token renovado exitosamente', data: userExists });
    } catch (error) {
        return res.status(403).json({ error: "INVALID_REFRESH_TOKEN", message: 'Refresh Token inválido o expirado' });
    }
};

module.exports = {
    register,
    login,
    logout,
    refreshToken
};

function setAccessToken(res, userId) {
    const token = createToken(userId);
    res.cookie('access_token', token, { ...cookieOptions, maxAge: 1000 * 60 * 60 });
}

function setRefreshToken(res, userId) {
    const refreshToken = createRefreshToken(userId);
    res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 14 });
}
