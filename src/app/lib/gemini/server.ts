import { GoogleGenerativeAI } from '@google/generative-ai';

// Access your API key as an environment variable.
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable not set.");
}

// Initializes the Generative Model
const genAI = new GoogleGenerativeAI(apiKey);

// You can export the initialized genAI object or a function to get a model
export const getGeminiModel = (modelName = 'gemini-1.5-flash') => {
    return genAI.getGenerativeModel({ model: modelName });
}

// Example usage in a server-side function or API route:
/*
import { getGeminiModel } from '@/lib/gemini/server';

async function processText(text: string) {
    const model = getGeminiModel();
    const result = await model.generateContent(text);
    const response = await result.response;
    const processedText = response.text();
    return processedText;
}
*/