const pool = require('../config/db')

// senderId = null significa notificacion del sistema
const createNotification = async (senderId = null, receiverId, type, content = null, relatedId = null) => {

    const typeRelated = {
        'friend_request': 'friendship_id',
        'friend_confirmation': 'friendship_id',
        'match_request': 'match_id',
        'match_confirmation': 'match_id',
        'match_edit_request': 'match_id',
        'match_edit_confirmation': 'match_id',
        'match_delete_request': 'match_id',
        'match_edit': 'match_id'
    }

    const relatedColumn = typeRelated[type] || null;

    let query = `
        INSERT INTO notifications (sender_id, receiver_id, type, content)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;

    if (relatedColumn) {
        query = `
            INSERT INTO notifications (sender_id, receiver_id, type, content, ${relatedColumn})
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
    }

    const result = await pool.query(query, [senderId, receiverId, type, content, relatedId]);
    return result.rows[0];
};

const getNotificationsByUserId = async (userId) => {
    const query = `
        SELECT n.*, u.nickname as sender_nickname
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.receiver_id = $1 ORDER BY n.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
};

const markNotificationAsRead = async (userId, notificationId) => {
    const query = `
        UPDATE notifications
        SET is_read = true
        WHERE receiver_id = $1 AND id = $2
        RETURNING id
    `;

    const result = await pool.query(query, [userId, notificationId]);
    return result.rows[0];
};

const markAllNotificationsAsRead = async (userId) => {
    const query = `
        UPDATE notifications
        SET is_read = true
        WHERE receiver_id = $1
        RETURNING id
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
};

const deleteNotification = async (userId, notificationId) => {
    const query = `
        DELETE FROM notifications
        WHERE receiver_id = $1 AND id = $2
        RETURNING id
    `;

    const result = await pool.query(query, [userId, notificationId]);
    return result.rows[0];
};

module.exports = {
    createNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};
