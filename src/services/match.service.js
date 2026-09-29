const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');

const createMatch = async (senderId, recipientId) => {
    const request = await matchModel.createMatch(senderId, recipientId);

    try {
        await notificationModel.createNotification(senderId, recipientId, "match_request", null, request.id);
    } catch (notifErr) {
        console.error("No se pudo crear la notificación:", notifErr);
    }

    return request;
};

module.exports = { createMatch, acceptMatch };
