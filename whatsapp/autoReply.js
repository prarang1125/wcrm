const fs = require('fs');
const path = require('path');
const { generateResponse } = require('../services/groq');

const settingsPath = path.join(__dirname, '../config/settings.json');

/**
 * Handle incoming messages for auto-reply logic
 */
async function handleAutoReply(client, message) {
    // 1. Ignore own messages
    if (message.fromMe) return;

    // 2. Get chat info
    const chat = await message.getChat();

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

    const chatId = chat.id._serialized;
    const isGroup = chat.isGroup;

    // 5. Check if auto-reply should trigger
    let shouldReply = false;

    if (isGroup) {
        // Trigger if group is in autoReplyGroups list
        if (settings.autoReplyGroups && settings.autoReplyGroups.includes(chatId)) {
            shouldReply = true;
        }
    } else {
        // Trigger for personal chats if autoReplyPersonal is enabled
        if (settings.autoReplyPersonal) {
            shouldReply = true;
        }
    }

    if (!shouldReply) return;

    // 6. Generate and send reply
    console.log(`Auto-replying to ${isGroup ? 'group' : 'private'} message from: ${chat.name || chat.id.user}`);
    const aiReply = await generateResponse(message.body);

    try {
        await message.reply(aiReply);
    } catch (err) {
        console.error('Failed to send auto-reply:', err);
    }
}

module.exports = {
    handleAutoReply
};
