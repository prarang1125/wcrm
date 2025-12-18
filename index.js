require('dotenv').config();
const express = require('express');
const client = require('./whatsapp/client');
const apiRoutes = require('./routes/api');
const { initScheduler } = require('./whatsapp/scheduler');
const { handleAutoReply } = require('./whatsapp/autoReply');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize WhatsApp
client.initialize();

// Listen for messages for auto-reply
client.on('message_create', async (msg) => {
    await handleAutoReply(client, msg);
});

// Setup API Routes
app.use('/api', apiRoutes(client));

// Start Scheduler
initScheduler(client);

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

app.listen(port, () => {
    console.log(`Backend service running on http://localhost:${port}`);
    console.log(`API endpoints available at http://localhost:${port}/api`);
});

// Crash recovery logic (basic)
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
