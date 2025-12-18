const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getAllGroups } = require('../whatsapp/groupManager');

const settingsPath = path.join(__dirname, '../config/settings.json');

/**
 * API Routes for WhatsApp Bot Management
 */
module.exports = (client) => {

    // 1. GET /groups - List all joined groups
    router.get('/groups', async (req, res) => {
        const groups = await getAllGroups(client);
        res.json({ success: true, groups });
    });

    // 2. POST /send-message - Manual broadcast
    router.post('/send-message', async (req, res) => {
        const { groupIds, message } = req.body;

        if (!groupIds || !Array.isArray(groupIds) || !message) {
            return res.status(400).json({ success: false, error: 'Invalid groupIds or message' });
        }

        const results = [];
        for (const id of groupIds) {
            try {
                await client.sendMessage(id, message);
                results.push({ id, status: 'sent' });
            } catch (err) {
                results.push({ id, status: 'failed', error: err.message });
            }
        }

        res.json({ success: true, results });
    });

    // 3. GET /config - Get current settings
    router.get('/config', (req, res) => {
        try {
            const data = fs.readFileSync(settingsPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (err) {
            res.status(500).json({ success: false, error: 'Failed to read config' });
        }
    });

    // 4. POST /config/reload - Optional reload (handled automatically by file read usually, but good for explicit trigger)
    router.post('/config/reload', (req, res) => {
        // Since we read from file every time, reload is implicit. 
        // We could also update in-memory cache here if we had one.
        res.json({ success: true, message: 'Configuration reloaded' });
    });

    return router;
};
