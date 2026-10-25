require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("ADVERTENCIA: GEMINI_API_KEY no está definida en las variables de entorno.");
}

const ai = new GoogleGenerativeAI(apiKey);

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

module.exports = {
    ai,
    DEFAULT_GEMINI_MODEL
};
