const bcrypt = require('bcryptjs');
const usersModel = require('../models/user.model');
const { createToken } = require('../middlewares/auth');

const register = async (req, res) => {
    try {
        const { nickname, email, password } = req.body;

        const userExists = await usersModel.findByEmail(email);

        if (userExists) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        if (password.length < 8 || password.length > 12) {
            return res.status(400).json({ message: "La contraseña debe tener entre 8 y 12 caracteres" });
        }

        if (nickname.includes(' ')) {
            return res.status(400).json({ message: "El nickname no debe contener espacios" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await usersModel.create(nickname, email, hashedPassword);

        setAccessToken(res, newUser);

        res.status(201).json({ message: "Usuario registrado exitosamente", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await usersModel.findByEmail(email);

        if (!userExists) {
            return res.status(400).json({ message: "El usuario no existe" });
        }

        const isPasswordValid = await bcrypt.compare(password, userExists.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Contraseña incorrecta" });
        }

        delete userExists.password;

        setAccessToken(res, userExists);

        res.status(200).json({ message: "Login exitoso", user: userExists });
    } catch (error) {
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('access_token', {
            httpOnly: true,
            // Quitar comentario para produccion cuando use https
            // secure: true,
            sameSite: 'strict',
        });
        res.status(200).json({ message: 'Se ha cerrado sesión correctamente' });
    } catch (error) {
        res.status(500).json({ error: "Error al cerrar sesión" });
    }
}

module.exports = {
    register,
    login,
    logout
};

function setAccessToken(res, user) {
    const token = createToken(user);

    res.cookie('access_token', token, {
        httpOnly: true,
        // Quitar comentario para produccion cuando use https
        // secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60
    });
}