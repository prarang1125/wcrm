const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp Client with LocalAuth for session persistence
// Puppeteer flags are optimized for AWS EC2 (Ubuntu)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

console.log('--- SYSTEM CHECK ---');
console.log('Node Version:', process.version);
console.log('Current WorkDir:', process.cwd());
console.log('Initializing WhatsApp Client...');

client.on('loading_screen', (percent, message) => {
    console.log(`LOADING: ${percent}% - ${message}`);
});

client.on('qr', (qr) => {
    console.log('\n--- SCAN QR CODE ---');
    qrcode.generate(qr, { small: true });
    console.log('--------------------\n');
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
