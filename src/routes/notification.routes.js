const express = require("express");
const { getNotificationsByUserId, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = require("../controllers/notification.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

router.get("/", verifyToken, getNotificationsByUserId);

router.patch("/all", verifyToken, markAllNotificationsAsRead);

router.patch("/:notificationId", verifyToken, markNotificationAsRead);

router.delete("/:notificationId", verifyToken, deleteNotification);

module.exports = router;