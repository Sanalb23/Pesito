const jwt = require("jsonwebtoken");

const createToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_KEY, { expiresIn: "1h" });
};

const createVerificationToken = (user) => {
    return jwt.sign(
        { id: user.id, purpose: "email-verification" },
        process.env.JWT_VERIFICATION_KEY,
        { expiresIn: "7d" }
    );
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
    verifyToken,
    createVerificationToken
};