const parseId = (value) => {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return null;
    }
    const num = Number(value);
    return (!isNaN(num) && Number.isInteger(num) && num > 0) ? num : null;
};


const PASSWORD_ERROR_MESSAGE = "La contraseña debe tener entre 8 y 12 caracteres, incluir una mayúscula, un número y un símbolo, y no contener espacios";

const isValidPassword = (password) => {
    if (typeof password !== 'string') {
        return false;
    }
    return password.length >= 8
        && password.length <= 12
        && !/\s/.test(password)
        && /[A-Z]/.test(password)
        && /\d/.test(password)
        && /[^a-zA-Z0-9\s]/.test(password);
};


module.exports = {
    parseId,
    isValidPassword,
    PASSWORD_ERROR_MESSAGE
};
