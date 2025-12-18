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

## API Documentation (Base URL: `http://<your-ec2-ip>:3000/api`)

### 1. List All Groups
Fetch a list of all groups the bot is currently a member of.
- **Endpoint**: `GET /groups`
- **Response**:
```json
{
  "success": true,
  "groups": [
    {
      "id": "120363185313511239@g.us",
      "name": "Family Group",
      "participantCount": 5
    }
  ]
}
```

### 2. Send Manual Message
Broadcast a message to one or more groups simultaneously.
- **Endpoint**: `POST /send-message`
- **Body**:
```json
{
  "groupIds": ["120363185313511239@g.us", "120363404761893588@g.us"],
  "message": "Hello everyone! This is a manual test message."
}
```
- **Response**:
```json
{
  "success": true,
  "results": [
    { "id": "120363185313511239@g.us", "status": "sent" },
    { "id": "120363404761893588@g.us", "status": "failed", "error": "Reason..." }
  ]
}
```

### 3. Get Current Config
View the contents of your `settings.json`.
- **Endpoint**: `GET /config`
- **Response**: Includes `autoReplyGroups`, `autoReplyPersonal`, and `scheduledMessages`.

### 4. Health Check
Verify if the backend is running.
- **Endpoint**: `GET /health` (Note: No `/api` prefix for this one)
- **Response**: `{"status": "OK", "uptime": 1234.56}`

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
