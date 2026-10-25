const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');
const teamGameModel = require('../models/team.game.model');
const geminiService = require('./gemini.service');

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

/**
 * Resuelve por similitud de nombres los IDs de los equipos correspondientes a un juego
 * y formatea los datos al esquema requerido para publicar un partido (POST /matches).
 */
const orchestrateMatchPayload = async (detectedData, gameId, options = {}) => {
    const [homeMatch, awayMatch] = await Promise.all([
        detectedData.homeTeam ? teamGameModel.findTeamByName(gameId, detectedData.homeTeam) : null,
        detectedData.awayTeam ? teamGameModel.findTeamByName(gameId, detectedData.awayTeam) : null
    ]);

    const homeTeamGame = homeMatch;
    const awayTeamGame = awayMatch;

    return {
        homeUserId: options.homeUserId !== undefined ? options.homeUserId : null,
        awayUserId: options.awayUserId !== undefined ? options.awayUserId : null,
        homeTeamId: homeTeamGame ? homeTeamGame.id : null,
        awayTeamId: awayTeamGame ? awayTeamGame.id : null,
        homeGoals: detectedData.homeGoals !== null && detectedData.homeGoals !== undefined ? detectedData.homeGoals : 0,
        awayGoals: detectedData.awayGoals !== null && detectedData.awayGoals !== undefined ? detectedData.awayGoals : 0,
        stats: detectedData.stats || {},
        detectedTeams: {
            home: {
                detected: detectedData.homeTeam || null,
                matchedName: homeTeamGame ? homeTeamGame.name : null,
                teamGameId: homeTeamGame ? homeTeamGame.id : null
            },
            away: {
                detected: detectedData.awayTeam || null,
                matchedName: awayTeamGame ? awayTeamGame.name : null,
                teamGameId: awayTeamGame ? awayTeamGame.id : null
            }
        },
        confidenceNotes: detectedData.confidenceNotes || null
    };
};

/**
 * Procesa la imagen mediante Gemini y formatea el payload del partido resolviendo los IDs de los equipos.
 */
const orchestrateMatchDetection = async ({ fileBuffer, mimeType, gameId, homeUserId, awayUserId }) => {
    const detectedData = await geminiService.detectMatchStatsFromImage(fileBuffer, mimeType);
    return await orchestrateMatchPayload(detectedData, gameId, { homeUserId, awayUserId });
};

module.exports = {
    requestCreate,
    requestEdit,
    requestDelete,
    confirmCreate,
    confirmEdit,
    confirmDelete,
    orchestrateMatchPayload,
    orchestrateMatchDetection
};
