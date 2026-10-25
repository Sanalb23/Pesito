const router = require('express').Router();
const { sendRequest, acceptRequest, deleteFriend, getFriends, getFriendshipStatus } = require('../controllers/friend.controller');
const { verifyToken } = require('../middlewares/auth');

router.get("/", verifyToken, getFriends);

router.get("/:userId", verifyToken, getFriendshipStatus);

router.post("/:userId", verifyToken, sendRequest);

router.patch("/:userId", verifyToken, acceptRequest);

router.delete("/:userId", verifyToken, deleteFriend);

module.exports = router;