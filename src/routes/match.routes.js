const express = require("express");
const {
    requestCreate,
    getMatchData,
    requestEdit,
    requestDelete,
    confirmMatch,
    confirmEdit,
    confirmDelete
} = require("../controllers/match.controller");
const { verifyToken } = require("../middlewares/auth");

const router = express.Router();

// Endpoints de solicitudes
router.post("/", verifyToken, requestCreate);
router.post("/:matchId/request-edit", verifyToken, requestEdit);
router.post("/:matchId/request-delete", verifyToken, requestDelete);

// Endpoints de confirmación
router.patch("/:matchId/confirm", verifyToken, confirmMatch);
router.put("/:matchId", verifyToken, confirmEdit);
router.delete("/:matchId", verifyToken, confirmDelete);

router.get("/:matchId", verifyToken, getMatchData);

module.exports = router;

