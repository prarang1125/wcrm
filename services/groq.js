const { Groq } = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate a response using Groq LLM API
 * @param {Array} history - Array of previous messages for context
 * @returns {Promise<string>} - AI generated reply
 */
async function generateResponse(history) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant. Rules:
1. Reply shortly and clearly (MAX 3 LINES).
2. Handle greetings (Hi, Hello, etc.) naturally and friendly.
3. Don't use bold characters or excessive emojis.
4. Reply based on the provided conversation history.`
                },
                ...history
            ],
            model: 'llama-3.3-70b-versatile',
        });

        return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
    } catch (error) {
        console.error('Groq AI Error:', error);
        return 'Bot experiencing technical difficulties with AI service.';
    }
}

module.exports = {
    generateResponse
};
