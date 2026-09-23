const teamGameModel = require("../models/team.game.model");

const cleanText = (text) => {
    if (!text || typeof text !== "string") return "";
    return text.trim().replace(/\s+/g, " ");
};

const matchTeam = async (gameId, rawTeamName) => {
    const cleaned = cleanText(rawTeamName);
    if (!cleaned) return null;
    return await teamGameModel.findTeamByNameAndGame(gameId, cleaned);
};

const matchFullPayload = async ({ gameId, rawHomeTeam, rawAwayTeam }) => {
    const [homeTeamResult, awayTeamResult] = await Promise.all([
        rawHomeTeam ? matchTeam(gameId, rawHomeTeam) : Promise.resolve(null),
        rawAwayTeam ? matchTeam(gameId, rawAwayTeam) : Promise.resolve(null)
    ]);

    return {
        homeTeam: homeTeamResult || null,
        awayTeam: awayTeamResult || null,
    };
};

module.exports = {
    cleanText: cleanText,
    matchTeam,
    matchFullPayload
};
