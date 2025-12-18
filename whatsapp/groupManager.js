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
        return groups;
    } catch (error) {
        console.error('Error fetching groups:', error);
        return [];
    }
}

module.exports = {
    getAllGroups
};
