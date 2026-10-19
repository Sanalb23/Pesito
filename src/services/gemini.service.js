const { ai, DEFAULT_GEMINI_MODEL } = require("../config/gemini");

/**
 * Esquema de respuesta de Gemini
 */
const matchDataSchema = {
    type: "OBJECT",
    properties: {
        homeTeam: {
            type: "STRING",
            description: "Home team name or abbreviation (displayed on the LEFT side or top of the screen/scoreboard)"
        },
        awayTeam: {
            type: "STRING",
            description: "Away team name or abbreviation (displayed on the RIGHT side or bottom of the screen/scoreboard)"
        },
        homeGoals: {
            type: "INTEGER",
            description: "Goals scored by home team (the number on the LEFT of the scoreboard/header)"
        },
        awayGoals: {
            type: "INTEGER",
            description: "Goals scored by away team (the number on the RIGHT of the scoreboard/header)"
        },
        stats: {
            type: "OBJECT",
            description: "Visible match statistics. The LEFT column of numbers corresponds to Home, and the RIGHT column of numbers corresponds to Away.",
            properties: {
                homePossession: { type: "INTEGER", description: "Home possession percentage (number on the LEFT of Possession row)" },
                awayPossession: { type: "INTEGER", description: "Away possession percentage (number on the RIGHT of Possession row)" },
                homeShots: { type: "INTEGER", description: "Home total shots (number on the LEFT of Shots row)" },
                awayShots: { type: "INTEGER", description: "Away total shots (number on the RIGHT of Shots row)" },
                homeShotsOnTarget: { type: "INTEGER", description: "Home shots on target (number on the LEFT of Shots on Target row)" },
                awayShotsOnTarget: { type: "INTEGER", description: "Away shots on target (number on the RIGHT of Shots on Target row)" },
                homePenalties: { type: "INTEGER", description: "Home penalties (number on the LEFT of Penalties row)" },
                awayPenalties: { type: "INTEGER", description: "Away penalties (number on the RIGHT of Penalties row)" },
                homeFreeKicks: { type: "INTEGER", description: "Home free kicks (number on the LEFT of Free Kicks row)" },
                awayFreeKicks: { type: "INTEGER", description: "Away free kicks (number on the RIGHT of Free Kicks row)" },
                homeCornerKicks: { type: "INTEGER", description: "Home corner kicks (number on the LEFT of Corner Kicks row)" },
                awayCornerKicks: { type: "INTEGER", description: "Away corner kicks (number on the RIGHT of Corner Kicks row)" },
                homeOffsides: { type: "INTEGER", description: "Home offsides (number on the LEFT of Offsides row)" },
                awayOffsides: { type: "INTEGER", description: "Away offsides (number on the RIGHT of Offsides row)" },
                homeFouls: { type: "INTEGER", description: "Home fouls (number on the LEFT of Fouls row)" },
                awayFouls: { type: "INTEGER", description: "Away fouls (number on the RIGHT of Fouls row)" },
                homeYellowCards: { type: "INTEGER", description: "Home yellow cards (number on the LEFT of Yellow Cards row)" },
                awayYellowCards: { type: "INTEGER", description: "Away yellow cards (number on the RIGHT of Yellow Cards row)" },
                homeRedCards: { type: "INTEGER", description: "Home red cards (number on the LEFT of Red Cards row)" },
                awayRedCards: { type: "INTEGER", description: "Away red cards (number on the RIGHT of Red Cards row)" }
            }
        },
        confidenceNotes: {
            type: "STRING",
            description: "Only mention fields that could not be identified or where there is uncertainty or ambiguity. Leave empty or null if all information was identified with full confidence."
        }
    }
};

const parseNumber = (val) => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
};

const detectMatchStatsFromImage = async (fileBuffer, mimeType = "image/jpeg") => {
    const base64Data = fileBuffer.toString("base64");

    const prompt = `
    You are an expert visual assistant specializing in football/soccer video games (such as EA Sports FC, FIFA, eFootball, Pro Evolution Soccer - PES) and real match summary screens.
    Carefully inspect the attached image containing a match summary or post-match statistics screen.

    VISUAL LAYOUT CONVENTIONS:
    1. TEAMS:
    - HOME TEAM: Displayed on the LEFT side (or top) of the screen / header.
    - AWAY TEAM: Displayed on the RIGHT side (or bottom) of the screen / header.
    - Look for full names, abbreviations, or team banners for both sides.

    2. SCORE / GOALS:
    - Located in the scoreboard header between or next to the two teams (e.g., "2 - 1", "0 : 0").
    - Extract homeGoals from the left number and awayGoals from the right number.

    3. TWO-COLUMN STATISTICS TABLE:
    - The stats table shows the metric name in the center, with TWO numerical columns:
        * LEFT column = Home team stats (homePossession, homeShots, homeShotsOnTarget, homeFouls, homeYellowCards, etc.).
        * RIGHT column = Away team stats (awayPossession, awayShots, awayShotsOnTarget, awayFouls, awayYellowCards, etc.).
    - Make sure to extract BOTH sides (home and away) for every visible metric row.

    RULES:
    - If a specific metric row is not present on screen, omit its keys.
    - Do NOT fabricate stats that are not shown.
    - In "confidenceNotes", ONLY mention fields that could not be identified, are blurry, cropped, or have uncertain values. If there are no doubts and everything was clearly identified, leave "confidenceNotes" empty or null.
    `;


    const response = await ai.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: [
            {
                inlineData: {
                    data: base64Data,
                    mimeType
                }
            },
            prompt
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: matchDataSchema
        }
    });

    const rawText = response.text || "";
    let parsedData;

    try {
        parsedData = JSON.parse(rawText);
    } catch {
        const cleaned = rawText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
        parsedData = JSON.parse(cleaned);
    }

    const extractedStats = parsedData.stats || {};
    const homeGoals = parseNumber(parsedData.homeGoals);
    const awayGoals = parseNumber(parsedData.awayGoals);

    return {
        homeTeam: parsedData.homeTeam || null,
        awayTeam: parsedData.awayTeam || null,
        homeGoals: homeGoals !== null ? homeGoals : null,
        awayGoals: awayGoals !== null ? awayGoals : null,
        stats: extractedStats,
        confidenceNotes: (typeof parsedData.confidenceNotes === "string" && parsedData.confidenceNotes.trim()) ? parsedData.confidenceNotes.trim() : null
    };
};

module.exports = {
    detectMatchStatsFromImage
};
