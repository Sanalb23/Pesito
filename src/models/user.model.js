const pool = require("../config/db")

const findByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

const create = async (nickname, email, hashedPassword) => {
    const query = 'INSERT INTO users (nickname, email, password) VALUES ($1, $2, $3) RETURNING id, nickname, email';
    const result = await pool.query(query, [nickname, email, hashedPassword]);
    return result.rows[0];
};

module.exports = {
    findByEmail,
    create,
};