import { GoogleGenerativeAI } from '@google/generative-ai';

// Configures and provides access to Google Gemini models.

/** API key for Google Generative AI from env var; throws error if not set. */
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable not set.");
}

/** Google Generative AI client instance. */
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Get a specific Gemini generative model.
 * @param {string} [modelName='gemini-1.5-flash'] - Model name (default 'gemini-1.5-flash').
 * @returns {GenerativeModel} The model instance.
 */
export const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
    return genAI.getGenerativeModel({ model: modelName });
}