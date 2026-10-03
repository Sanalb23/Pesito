const friendModel = require('../models/friend.model');
const friendService = require('../services/friend.service');
const { parseId } = require('../utils/validators');

const sendRequest = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const targetId = parseId(req.params.userId);

        if (!targetId) {
            return res.status(400).json({ error: "INVALID_USER_ID", message: "ID de usuario inválido" });
        }

        if (userId === targetId) {
            return res.status(400).json({ error: "SELF_REQUEST", message: "No puedes enviarte una solicitud de amistad a ti mismo" });
        }

        const request = await friendService.requestFriend(userId, targetId);
        res.status(201).json({ message: "Solicitud enviada", data: request });
    } catch (error) {
        if (error.code === '23505') {
            if (error.constraint === 'prevent_inverted_friendships') {
                return res.status(409).json({ error: "FRIENDSHIP_ALREADY_EXISTS", message: "Ya existe una solicitud o amistad activa con este usuario" });
            }
        }

        if (error.code === '23514') {
            if (error.constraint === 'chk_ids_distinct') {
                return res.status(400).json({ error: "SELF_REQUEST", message: "No puedes enviarte una solicitud de amistad a ti mismo" });
            }
        }

        res.status(500).json({ error: "SEND_REQUEST_ERROR", message: "Error al enviar la solicitud de amistad" });
    }
};

const acceptRequest = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const friendId = parseId(req.params.userId);

        if (!friendId) {
            return res.status(400).json({ error: "INVALID_USER_ID", message: "ID de usuario inválido" });
        }

        const acceptedRequest = await friendService.confirmFriend(userId, friendId);

        if (!acceptedRequest) {
            return res.status(404).json({ error: "REQUEST_NOT_FOUND", message: "Solicitud no encontrada" });
        }

        res.status(200).json({ message: "Solicitud aceptada", data: acceptedRequest });
    } catch (error) {
        res.status(500).json({ error: "ACCEPT_REQUEST_ERROR", message: 'Error al aceptar la solicitud' });
    }
}

const deleteFriend = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const friendId = parseId(req.params.userId);

        const deletedFriend = await friendModel.deleteFriend(userId, friendId);
        res.status(200).json({ message: "Amistad eliminada", data: deletedFriend });
    } catch (error) {
        res.status(500).json({ error: "DELETE_FRIEND_ERROR", message: 'Error al eliminar amigo' });
    }
}

const getFriends = async (req, res) => {
    try {
        const userId = parseId(req.user.id);

        const friends = await friendModel.getFriends(userId);
        res.status(200).json({ message: "Lista de amigos obtenida", data: friends });
    } catch (error) {
        res.status(500).json({ error: "GET_FRIENDS_ERROR", message: 'Error al obtener la lista de amigos' });
    }
}

const getFriendshipStatus = async (req, res) => {
    try {
        const userId = parseId(req.user.id);
        const targetId = parseId(req.params.userId);

        if (!targetId) {
            return res.status(400).json({ error: "INVALID_USER_ID", message: "ID de usuario inválido" });
        }

        if (userId === targetId) {
            return res.status(200).json({ message: "Estado de amistad obtenido", data: { status: "self", friendship: null } });
        }

        const friendship = await friendModel.getFriendship(userId, targetId);

        if (!friendship) {
            return res.status(200).json({ message: "Estado de amistad obtenido", data: { status: "none", friendship: null } });
        }

        let status = friendship.status;
        if (friendship.status === 'Pending') {
            status = friendship.user_id === userId ? 'pending_sent' : 'pending_received';
        } else if (friendship.status === 'Active') {
            status = 'active';
        }

        res.status(200).json({ message: "Estado de amistad obtenido", data: { status, friendship } });
    } catch (error) {
        res.status(500).json({ error: "GET_FRIENDSHIP_STATUS_ERROR", message: 'Error al obtener el estado de la amistad' });
    }
}

module.exports = {
    sendRequest,
    acceptRequest,
    deleteFriend,
    getFriends,
    getFriendshipStatus,
};