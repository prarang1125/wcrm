const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getAllGroups } = require('../whatsapp/groupManager');
const { generateResponse } = require('../services/groq');
const { calculateNextRun, validateSchedule } = require('../services/scheduleCalculator');
const { DateTime } = require('luxon');

/**
 * Helper to pause execution (Anti-Ban loop delay)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = (client) => {

    // 1. GET /groups - List all joined groups (Syncs with DB)
    router.get('/groups', async (req, res) => {
        try {
            const groups = await getAllGroups(client);
            res.json({ success: true, count: groups.length, groups });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 2. POST /send-message - Advanced broadcast with delays/AI
    router.post('/send-message', async (req, res) => {
        let { targets, message, delay, enhanceAI, context } = req.body;

        const sendTargets = targets || req.body.groupIds;
        if (!sendTargets || !Array.isArray(sendTargets) || !message) {
            return res.status(400).json({ success: false, error: 'targets (array) and message are required' });
        }

        const waitTime = (delay || 8) * 1000;
        const results = [];

        for (let i = 0; i < sendTargets.length; i++) {
            const target = sendTargets[i];

            try {
                let finalMessage = message;

                if (enhanceAI == 1 || enhanceAI === true) {
                    const aiPrompt = `Context: ${context || 'General'}\n\nOriginal Message: ${message}\n\nPlease improve this message for WhatsApp. Keep it professional/engaging and suitable for the context. Max 3 lines.`;
                    finalMessage = await generateResponse([{ role: 'user', content: aiPrompt }]);
                }

                await client.sendMessage(target, finalMessage);
                results.push({ id: target, status: 'sent' });

                if (i < sendTargets.length - 1) {
                    console.log(`Loop delay: Waiting ${waitTime}ms before next message...`);
                    await sleep(waitTime);
                }
            } catch (err) {
                console.error(`Failed to send to ${target}:`, err);
                results.push({ id: target, status: 'failed', error: err.message });
            }
        }

        res.json({ success: true, processed: results.length, results });
    });

    // 3. POST /scheduling-message - Production-grade scheduler
    router.post('/scheduling-message', (req, res) => {
        try {
            const { target, message, url, start_date, time, frequency, week_days, timezone, enhance_ai, context } = req.body;

            // Validate
            const errors = validateSchedule(req.body);
            if (errors.length > 0) {
                return res.status(400).json({ success: false, errors });
            }

            // Calculate initial next_run_at
            const scheduleInput = {
                frequency,
                start_date,
                time,
                week_days: week_days ? JSON.stringify(week_days) : null,
                timezone: timezone || 'Asia/Kolkata',
                last_run_at: null
            };

            const next_run_at = calculateNextRun(scheduleInput);

            if (!next_run_at && frequency !== 'once') {
                return res.status(500).json({ success: false, error: 'Failed to calculate next run time' });
            }

            // Normalize target (stringify if array)
            const dbTarget = Array.isArray(target) ? JSON.stringify(target) : target;

            // Insert into database
            const stmt = db.prepare(`
                INSERT INTO scheduled_messages 
                (target, message, url, start_date, time, frequency, week_days, timezone, enhance_ai, context, next_run_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const info = stmt.run(
                dbTarget,
                message || null,
                url || null,
                start_date,
                time,
                frequency,
                week_days ? JSON.stringify(week_days) : null,
                timezone || 'Asia/Kolkata',
                enhance_ai ? 1 : 0,
                context || null,
                next_run_at || DateTime.fromISO(`${start_date}T${time}`, { zone: timezone || 'Asia/Kolkata' }).toISO()
            );

            res.json({
                success: true,
                schedule_id: info.lastInsertRowid,
                next_run_at: next_run_at
            });

        } catch (err) {
            console.error('Schedule creation error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 4. GET /scheduled-messages - List all active schedules
    router.get('/scheduled-messages', (req, res) => {
        try {
            const schedules = db.prepare("SELECT * FROM scheduled_messages WHERE status = 'active' ORDER BY next_run_at ASC").all();
            res.json({ success: true, count: schedules.length, schedules });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // 5. PUT /scheduled-messages/:id - Update schedule status or basic details
    router.put('/scheduled-messages/:id', (req, res) => {
        const { id } = req.params;
        const { status, message, time, frequency } = req.body;

        try {
            const now = DateTime.now().setZone('Asia/Kolkata').toISO();
            const stmt = db.prepare(`
                UPDATE scheduled_messages 
                SET status = COALESCE(?, status),
                    message = COALESCE(?, message),
                    time = COALESCE(?, time),
                    frequency = COALESCE(?, frequency),
                    updated_at = ?
                WHERE id = ?
            `);
            stmt.run(status, message, time, frequency, now, id);
            res.json({ success: true, message: 'Schedule updated' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Health check
    router.get('/health', (req, res) => {
        res.json({ status: 'OK', uptime: process.uptime() });
    });

    return router;
};
