const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../config/settings.json');

/**
 * Initialize the cron-based scheduler for automated messages
 */
function initScheduler(client) {
    // Runs every minute
    cron.schedule('* * * * *', async () => {
        try {
            const data = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(data);

            if (!settings.scheduledMessages || settings.scheduledMessages.length === 0) return;

            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            for (const item of settings.scheduledMessages) {
                if (item.time === currentTime) {
                    console.log(`Executing scheduled message to ${item.groupId}...`);
                    try {
                        await client.sendMessage(item.groupId, item.message);
                        console.log(`Scheduled message sent successfully to ${item.groupId}`);
                    } catch (err) {
                        console.error(`Failed to send scheduled message to ${item.groupId}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error('Scheduler error:', err);
        }
    });

    console.log('Message Scheduler initialized.');
}

module.exports = {
    initScheduler
};
