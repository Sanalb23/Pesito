const notificationModel = require('../models/notification.model')

const createNotification = async (req, res) => {
    try {
        const { senderId = null, receiverId, type, content = null, relatedId = null } = req.body;
        const notification = await notificationModel.createNotification(senderId, receiverId, type, content, relatedId);
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la notificación' });
    }
}

const getNotificationsByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationModel.getNotificationsByUserId(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las notificaciones' });
    }
}

const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        const notification = await notificationModel.markNotificationAsRead(userId, notificationId);
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error al marcar la notificación como leída' });
    }
}

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationModel.markAllNotificationsAsRead(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas: ' + error });
    }
}

const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        const notification = await notificationModel.deleteNotification(userId, notificationId);
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la notificación' });
    }
}

module.exports = {
    createNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
}