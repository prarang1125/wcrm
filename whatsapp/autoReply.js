const fs = require('fs');
const path = require('path');
const { generateResponse } = require('../services/groq');

const settingsPath = path.join(__dirname, '../config/settings.json');

const debounceTimers = new Map();

/**
 * Handle incoming messages for auto-reply logic
 */
async function handleAutoReply(client, message) {
    // 1. Ignore own messages
    if (message.fromMe) return;

    // 2. Get chat info
    const chat = await message.getChat();
    const chatId = chat.id._serialized;
    const isGroup = chat.isGroup;
    const senderId = isGroup ? message.author || message.from : message.from; // Use author in groups

    // 3. Ignore media messages
    if (message.hasMedia) return;

    // 4. Check settings
    let settings;
    try {
        const data = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(data);
    } catch (err) {
        console.error('Error reading settings for auto-reply:', err);
        return;
    }

    // Check if auto-reply should trigger
    let shouldReply = false;
    if (isGroup) {
        if (settings.autoReplyGroups && settings.autoReplyGroups.includes(chatId)) {
            shouldReply = true;
        }
    } else {
        if (settings.autoReplyPersonal) {
            shouldReply = true;
        }
    }

    if (!shouldReply) return;

    // 5. DEBOUNCING: Wait for 5 seconds of silence from THIS specific user (Anti-Ban)
    const debounceKey = `${chatId}_${senderId}`;
    if (debounceTimers.has(debounceKey)) {
        clearTimeout(debounceTimers.get(debounceKey));
    }

    const timer = setTimeout(async () => {
        debounceTimers.delete(debounceKey);
        await processReply(chat, senderId);
    }, 5000);

    debounceTimers.set(debounceKey, timer);
}

/**
 * Process the actual reply generation and sending
 * @param {object} chat - The chat object
 * @param {string} senderId - The specific user we are replying to
 */
async function processReply(chat, senderId) {
    try {
        // A. Start typing simulation
        await chat.sendStateTyping();

        // B. Fetch last 50 messages to find enough history for this specific user
        const messages = await chat.fetchMessages({ limit: 50 });

        // Filter: Keep only messages from this sender OR from the bot (assistant)
        // This prevents mixing context from different people in a group.
        const filteredHistory = messages
            .filter(msg => msg.from === senderId || msg.fromMe)
            .slice(-10) // Take last 10 relevant messages
            .map(msg => ({
                role: msg.fromMe ? 'assistant' : 'user',
                content: msg.body
            }));

        // C. Generate AI Response
        const aiReply = await generateResponse(filteredHistory);

        // D. Random Delay before sending (Anti-ban: 2-4 seconds)
        const delay = Math.floor(Math.random() * 2000) + 2000;

        setTimeout(async () => {
            try {
                await chat.sendMessage(aiReply);
                await chat.clearState(); // Stop typing simulation
            } catch (err) {
                console.error('Failed to send text reply:', err);
            }
        }, delay);

    } catch (err) {
        console.error('Error processing reply:', err);
        await chat.clearState();
    }
}

module.exports = {
    handleAutoReply
};
