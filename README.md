# WhatsApp Group Management System (Minimal Backend)

A stable, production-safe Node.js backend to manage WhatsApp groups, send manual/scheduled messages, and enable AI auto-replies using Groq.

## Features
- ✅ **WhatsApp Connection**: persistent login using `LocalAuth`.
- ✅ **Group Management**: List all joined groups via API.
- ✅ **Broadcast**: Send manual messages to multiple groups at once.
- ✅ **Scheduler**: Cron-based automated messages (configured in JSON).
- ✅ **AI Auto-Reply**: Intelligent group replies using Groq LLM (Llama 3).
- ✅ **EC2 Compatible**: Optimized Puppeteer flags for headless Linux environments.

---

## Prerequisites
- AWS EC2 Instance (Ubuntu 22.04+ recommended)
- Node.js (v18+ LTS)
- Groq API Key (from [console.groq.com](https://console.groq.com/))

---

## AWS EC2 Setup Instructions

### 1. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Puppeteer Dependencies (Chrome Headless)
This is critical for `whatsapp-web.js` to run on Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y libgbm-dev wget gnupg ca-certificates procps libxss1 \
libasound2 libatk-bridge2.0-0 libgtk-3-0 libnss3 libxcomposite1 libxcursor1 \
libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxtst6 \
fonts-liberation libappindicator3-1 libpangocairo-1.0-0 x11-utils
```

### 3. Clone & Install
```bash
git clone <your-repo-url>
cd whatsapp-bot
npm install
```

### 4. Configure Environment
Create a `.env` file:
```env
GROQ_API_KEY=your_key_here
PORT=3000
```

### 5. Running with PM2 (Production)
```bash
sudo npm install -g pm2
pm2 start index.js --name "whatsapp-bot"
```

---

## Usage Guide

### Logging In
1. Start the app: `node index.js`.
2. A QR code will appear in the terminal.
3. Scan it with your WhatsApp (Linked Devices).
4. Once "Ready", the session is saved in `.wwebjs_auth/`.

### API Endpoints
- **List Groups**: `GET /api/groups`
- **Send Message**: 
  - `POST /api/send-message`
  - Body: `{"groupIds": ["xxx@g.us"], "message": "Hello!"}`
- **Check Health**: `GET /health`

### Configuration (`config/settings.json`)
Edit this file to enable features for specific groups:
- `enabledGroups`: IDs of groups the bot should interact with.
- `autoReplyGroups`: IDs where the Groq AI should reply to incoming messages.
- `scheduledMessages`: Objects with `groupId`, `message`, and `time` (HH:mm).

---

## Important Rules
- The bot ignores its own messages to avoid loops.
- The bot ignores media messages (images/videos) to save API costs.
- Ensure the EC2 security group allows traffic on your `PORT` (default 3000).
