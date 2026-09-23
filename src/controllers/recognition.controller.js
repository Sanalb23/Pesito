const recognitionService = require("../services/recognition.service");
const { parseId } = require("../utils/validators");

const resolveMatchData = async (req, res) => {
    try {
        const { gameId, rawHomeTeam, rawAwayTeam } = req.body;
        const parsedGameId = parseId(gameId);

        if (!parsedGameId) {
            return res.status(400).json({ error: "El ID del juego es inválido" });
        }

        const result = await recognitionService.matchFullPayload({
            gameId: parsedGameId,
            rawHomeTeam,
            rawAwayTeam
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Error al resolver los datos escaneados del partido" });
    }
};

module.exports = {
    resolveMatchData
};
