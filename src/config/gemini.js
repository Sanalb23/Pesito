require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("ADVERTENCIA: GEMINI_API_KEY no está definida en las variables de entorno.");
}

const ai = new GoogleGenAI({ apiKey });

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

module.exports = {
    ai,
    DEFAULT_GEMINI_MODEL
};
