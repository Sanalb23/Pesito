const jwt = require("jsonwebtoken");

const createToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_KEY, { expiresIn: "1h" });
};

const createRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_KEY, { expiresIn: "14d" });
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_KEY);
};

const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido" });
    }
};

module.exports = {
    createToken,
    createRefreshToken,
    verifyToken,
    verifyRefreshToken,
};