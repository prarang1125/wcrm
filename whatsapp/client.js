const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp Client with LocalAuth for session persistence
// Puppeteer flags are optimized for AWS EC2 (Ubuntu)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Standard headless mode
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

// Added logging to track initialization steps
console.log('Initializing WhatsApp Client...');

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN:', percent, message);
});

client.on('qr', (qr) => {
    console.log('--- SCAN QR CODE TO LOGIN ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is READY!');
});

client.on('authenticated', () => {
    console.log('WhatsApp Client AUTHENTICATED');
});

client.on('auth_failure', (msg) => {
    console.error('WhatsApp AUTHENTICATION FAILURE:', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client DISCONNECTED:', reason);
    // Auto-reconnect logic
    console.log('Attempting to reconnect...');
    client.initialize();
});

module.exports = client;
