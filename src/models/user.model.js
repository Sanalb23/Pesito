const pool = require("../config/db")

const findByEmail = async (email) => {
    const query = 'SELECT id, nickname, email, password FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
};

const create = async (nickname, email, hashedPassword) => {
    const query = 'INSERT INTO users (nickname, email, password) VALUES ($1, $2, $3) RETURNING id, nickname, email';
    const result = await pool.query(query, [nickname, email, hashedPassword]);
    return result.rows[0];
};

const findByNickname = async (nickname) => {
    const query = 'SELECT id, nickname FROM users WHERE nickname ILIKE $1';
    const result = await pool.query(query, ['%' + nickname + '%']);
    return result.rows;
};

const findById = async (id) => {
    const query = 'SELECT id, nickname FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    findByEmail,
    create,
    findByNickname,
    findById
};