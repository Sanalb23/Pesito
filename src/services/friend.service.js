const friendModel = require('../models/friend.model');
const notificationModel = require('../models/notification.model');

const requestFriend = async (userId, targetId) => {
    const request = await friendModel.sendRequest(userId, targetId);

    try {
        await notificationModel.createNotification(userId, targetId, "friend_request", null, request.id);
    } catch (notifErr) {
        console.error("No se pudo crear la notificación:", notifErr);
    }

    return request;
};

const confirmFriend = async (userId, friendId) => {
    const request = await friendModel.acceptRequest(userId, friendId);

    if (friendId && request) {
        try {
            await notificationModel.createNotification(userId, friendId, "friend_confirmation", null, request.id);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return request;
};

module.exports = {
    requestFriend,
    confirmFriend,
};
