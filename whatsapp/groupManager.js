const db = require('../database/db');

/**
 * Logic to fetch and manage WhatsApp groups
 */
async function getAllGroups(client) {
    try {
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(group => ({
                id: group.id._serialized,
                name: group.name,
                participantCount: group.groupMetadata ? group.groupMetadata.participants.length : 'N/A'
            }));

        // Sync to SQLite
        const stmt = db.prepare('INSERT OR REPLACE INTO groups (id, name, participant_count) VALUES (?, ?, ?)');
        const syncTransaction = db.transaction((groups) => {
            for (const group of groups) {
                stmt.run(group.id, group.name, group.participantCount);
            }
        });
        syncTransaction(groups);

        return groups;
    } catch (error) {
        console.error('Error fetching groups:', error);
        return [];
    }
}

module.exports = {
    getAllGroups
};
