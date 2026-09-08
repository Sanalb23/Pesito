const bcrypt = require('bcryptjs');
const usersModel = require('../models/user.model');

const register = async (req, res) => {
    try {
        const { nickname, email, password } = req.body;

        const userExists = await usersModel.findByEmail(email);

        if (userExists) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await usersModel.create(nickname, email, hashedPassword);

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

        res.status(200).json({ message: "Login exitoso", user: userExists });
    } catch (error) {
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
};

module.exports = {
    register,
    login
};