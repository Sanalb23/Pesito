const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');

const requestCreate = async (matchData, senderId = null) => {
    const request = await matchModel.create(matchData);

    const homeUserId = matchData.homeUserId ? Number(matchData.homeUserId) : null;
    const awayUserId = matchData.awayUserId ? Number(matchData.awayUserId) : null;
    const currentSenderId = senderId ? Number(senderId) : (matchData.senderId ? Number(matchData.senderId) : null);

    let receiverId = null;
    if (currentSenderId) {
        if (currentSenderId === homeUserId) {
            receiverId = awayUserId;
        } else if (currentSenderId === awayUserId) {
            receiverId = homeUserId;
        }
    }

    if (currentSenderId && receiverId) {
        try {
            await notificationModel.createNotification(currentSenderId, receiverId, "match_request", null, request.id);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return request;
};

const requestEdit = async (matchId, senderId, receiverId, updatedMatchData) => {
    if (receiverId) {
        try {
            await notificationModel.createNotification(senderId, receiverId, "match_edit_request", updatedMatchData, matchId);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return { id: matchId };
};

const requestDelete = async (matchId, senderId, receiverId) => {
    if (receiverId) {
        try {
            await notificationModel.createNotification(senderId, receiverId, "match_delete_request", null, matchId);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return { id: matchId };
};

const confirmCreate = async (matchId, senderId, receiverId) => {
    const request = await matchModel.setActive(matchId);

    if (receiverId) {
        try {
            await notificationModel.createNotification(senderId, receiverId, "match_confirmation", null, request.id);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return request;
};

const confirmEdit = async (matchId, senderId, receiverId, updatedMatchData) => {
    const request = await matchModel.editMatch(matchId, updatedMatchData);

    if (receiverId) {
        try {
            await notificationModel.createNotification(senderId, receiverId, "match_edit_confirmation", null, matchId);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return request;
};

const confirmDelete = async (matchId, senderId, receiverId) => {
    const request = await matchModel.deleteMatch(matchId);

    if (receiverId) {
        try {
            await notificationModel.createNotification(senderId, receiverId, "match_delete_confirmation", null, null);
        } catch (notifErr) {
            console.error("No se pudo crear la notificación:", notifErr);
        }
    }

    return request;
};

module.exports = {
    requestCreate,
    requestEdit,
    requestDelete,
    confirmCreate,
    confirmEdit,
    confirmDelete,
};
