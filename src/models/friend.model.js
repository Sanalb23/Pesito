const pool = require("../config/db")

const sendRequest = async (userId, targetId) => {
    const query = `INSERT INTO user_friends (user_id, friend_id)
    VALUES ($1, $2) RETURNING id;`
    const result = await pool.query(query, [userId, targetId]);
    return result.rows[0];
}

const acceptRequest = async (userId, friendId) => {
    const query = `UPDATE user_friends SET status = 'Active' WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) RETURNING *;`
    const result = await pool.query(query, [userId, friendId]);
    return result.rows[0];
}

const deleteFriend = async (userId, friendId) => {
    const query = `DELETE FROM user_friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1) RETURNING *;`
    const result = await pool.query(query, [userId, friendId]);
    return result.rows[0];
}

const getFriends = async (userId) => {
    const query = `
    SELECT u.id, u.nickname
    FROM user_friends uf
    JOIN users u ON u.id = CASE 
        WHEN uf.user_id = $1 THEN uf.friend_id 
        ELSE uf.user_id 
    END
    WHERE (uf.user_id = $1 OR uf.friend_id = $1) AND uf.status = 'Active';`
    const result = await pool.query(query, [userId]);
    return result.rows;
}


const getFriendship = async (userId, targetId) => {
    const query = `
    SELECT id, user_id, friend_id, status
    FROM user_friends
    WHERE (user_id = $1 AND friend_id = $2)
       OR (user_id = $2 AND friend_id = $1);`;
    const result = await pool.query(query, [userId, targetId]);
    return result.rows[0];
};

const areFriends = async (userId, targetId) => {
    const query = `
    SELECT 1 FROM user_friends
    WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
      AND status = 'Active';`;
    const result = await pool.query(query, [userId, targetId]);
    return (result.rowCount ?? result.rows.length) > 0;
};

module.exports = {
    sendRequest,
    acceptRequest,
    deleteFriend,
    getFriends,
    getFriendship,
    areFriends,
};