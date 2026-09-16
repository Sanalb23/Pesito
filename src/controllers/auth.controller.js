const bcrypt = require('bcryptjs');
const usersModel = require('../models/user.model');
const { createToken, createVerificationToken } = require('../middlewares/auth');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { nickname, email, password } = req.body;

        const userExists = await usersModel.findByEmail(email);

        if (userExists) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await usersModel.create(nickname, email, hashedPassword);

        const verificationToken = createVerificationToken(newUser);

        await sendVerificationEmail(newUser.email, verificationToken);

        res.status(201).json({ message: "Usuario registrado exitosamente", user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar el usuario" + error });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await usersModel.findByEmail(email);

        if (!userExists) {
            return res.status(400).json({ message: "El usuario no existe" });
        }

        if (!userExists.verified) {
            return res.status(403).json({ message: "Debes verificar tu correo antes de iniciar sesión" });
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

const verifyUser = async (req, res) => {
    try {
        const token = req.query.token;

        if (!token) {
            return res.status(400).json({ message: "Token no proporcionado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_KEY);

        await usersModel.verifyUser(decoded.id);

        res.status(200).json({ message: "Usuario verificado exitosamente", user: decoded });
    } catch (error) {
        res.status(401).json({ message: "Token inválido" });
    }
};

module.exports = {
    register,
    login,
    verifyUser
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