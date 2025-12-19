const cron = require('node-cron');
const db = require('../database/db');
const axios = require('axios');
const { DateTime } = require('luxon');
const { generateResponse } = require('../services/groq');
const { calculateNextRun } = require('../services/scheduleCalculator');

/**
 * Production-grade scheduler with next_run_at precomputation
 */
function initScheduler(client) {
    console.log('Initializing production scheduler...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = DateTime.now().toISO();

            // Query all active schedules that are due
            const dueSchedules = db.prepare(`
                SELECT * FROM scheduled_messages 
                WHERE status = 'active' 
                AND next_run_at <= ?
                ORDER BY next_run_at ASC
            `).all(now);

            if (dueSchedules.length > 0) {
                console.log(`Found ${dueSchedules.length} due schedule(s)`);
            }

            for (const schedule of dueSchedules) {
                await processSchedule(client, schedule);
            }

        } catch (err) {
            console.error('Scheduler error:', err);
        }
    });

    console.log('Production scheduler initialized (cron-based with next_run_at)');
}

/**
 * Process a single schedule
 */
async function processSchedule(client, schedule) {
    const { id, target, message, url, enhance_ai, context, frequency } = schedule;

    try {
        console.log(`Processing schedule #${id} for ${target}`);

        // 1. Fetch content
        let content = message;
        if (url) {
            try {
                const response = await axios.get(url, { timeout: 10000 });
                if (response.data && response.data.message) {
                    content = response.data.message;
                } else if (typeof response.data === 'string') {
                    content = response.data;
                } else {
                    console.warn(`URL ${url} returned unexpected format, using stored message`);
                }
            } catch (urlError) {
                console.error(`Failed to fetch URL for schedule #${id}:`, urlError.message);
                // Fall back to stored message
                if (!message) {
                    throw new Error('URL fetch failed and no fallback message available');
                }
            }
        }

        if (!content) {
            throw new Error('No content available to send');
        }

        // 2. AI Enhancement
        if (enhance_ai) {
            try {
                const aiPrompt = `Context: ${context || 'General'}\n\nMessage: ${content}\n\nPlease improve this message for WhatsApp. Keep it professional, clear, and concise. Max 3 lines. Do not change the intent or add new information.`;
                content = await generateResponse([{ role: 'user', content: aiPrompt }]);
            } catch (aiError) {
                console.error(`AI enhancement failed for schedule #${id}:`, aiError.message);
                // Continue with original content
            }
        }

        // 3. Parse targets (Support single string or JSON array)
        let targets = [];
        if (typeof target === 'string' && target.startsWith('[') && target.endsWith(']')) {
            try {
                targets = JSON.parse(target);
            } catch (e) {
                targets = [target];
            }
        } else {
            targets = [target];
        }

        // 4. Send message to each target with anti-ban delay
        for (let i = 0; i < targets.length; i++) {
            const currentTarget = targets[i];
            try {
                await client.sendMessage(currentTarget, content);
                console.log(`Successfully sent schedule #${id} to ${currentTarget}`);

                // Anti-ban delay between multiple targets
                if (i < targets.length - 1) {
                    const delay = 8000 + Math.random() * 2000; // 8-10s
                    console.log(`Multi-target delay: waiting ${Math.round(delay / 1000)}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (sendErr) {
                console.error(`Failed to send schedule #${id} to ${currentTarget}:`, sendErr.message);
            }
        }

        // 5. Update schedule
        const now = DateTime.now().toISO();

        if (frequency === 'once') {
            // Mark as completed
            db.prepare(`
                UPDATE scheduled_messages 
                SET status = 'completed', last_run_at = ?, updated_at = ?
                WHERE id = ?
            `).run(now, now, id);
            console.log(`Schedule #${id} marked as completed (once)`);
        } else {
            // Calculate next run
            const nextRun = calculateNextRun({
                ...schedule,
                last_run_at: now
            });

            if (nextRun) {
                db.prepare(`
                    UPDATE scheduled_messages 
                    SET last_run_at = ?, next_run_at = ?, updated_at = ?
                    WHERE id = ?
                `).run(now, nextRun, now, id);
                console.log(`Schedule #${id} next run: ${nextRun}`);
            } else {
                // Shouldn't happen for daily/weekly
                db.prepare(`
                    UPDATE scheduled_messages 
                    SET status = 'completed', last_run_at = ?, updated_at = ?
                    WHERE id = ?
                `).run(now, now, id);
            }
        }

    } catch (err) {
        console.error(`Failed to process schedule #${id}:`, err.message);

        // Log failure but don't mark as failed - will retry next cycle
        // In production, you might want to add a retry_count field
    }
}

module.exports = {
    initScheduler
};
