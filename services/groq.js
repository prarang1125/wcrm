const { Groq } = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate a response using Groq LLM API
 * @param {string} prompt - User message content
 * @returns {Promise<string>} - AI generated reply
 */
async function generateResponse(prompt) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Reply shortly and clearly for students and freshers. Keep it helpful and professional.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'openai/gpt-oss-120b', // Reliable and fast model
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
