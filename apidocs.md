# WhatsApp Bot API Documentation (Production Scheduler)

This document outlines the available API endpoints for the professional-grade WhatsApp scheduling system.

**Base URL**: `http://localhost:3000/api`

---

## 1. Get All Groups
List all groups the bot is currently in and sync them to the database.
- **Endpoint**: `GET /groups`
- **Response**:
```json
{
  "success": true,
  "count": 5,
  "groups": [...]
}
```

---

## 2. Advanced Send Message
Broadcast a message to multiple targets with loop delays (anti-ban) and optional AI enhancement.
- **Endpoint**: `POST /send-message`
- **Body Params**:
  - `targets` (Array): List of Group IDs or Numbers.
  - `message` (String): Text to send.
  - `delay` (Number): Delay in seconds between sends (Default: 8).
  - `enhanceAI` (Boolean/Int): `1` or `true` to use AI.
  - `context` (String): Context for AI.

---

## 3. Dynamic Message Scheduler
Schedule a message with precision for once, daily, or weekly execution.
- **Endpoint**: `POST /scheduling-message`
- **Body Params**:
```json
{
  "target": "string | array",      // Group ID, number, or array of both
  "message": "string | null",         // Optional if url is provided
  "url": "string | null",             // Optional if message is provided
  "start_date": "YYYY-MM-DD",         // Starting date
  "time": "HH:mm",                    // Execution time
  "frequency": "once | daily | weekly",
  "week_days": ["mon","wed"],         // Required only if frequency is 'weekly'
  "timezone": "Asia/Kolkata",         // Default IST
  "enhance_ai": true,                 // AI tuning at send-time
  "context": "string"                 // Context for AI
}
```
**Rules**:
- Either `message` or `url` must be provided.
- If `url` is provided, the bot will fetch the content from it at send-time.
- `week_days` options: `mon, tue, wed, thu, fri, sat, sun`.

---

## 4. List Active Schedules
Get all active/pending schedules.
- **Endpoint**: `GET /scheduled-messages`

---

## 5. Update Schedule
Update status or details of a schedule.
- **Endpoint**: `PUT /scheduled-messages/:id`
- **Body Params**:
  - `status`: `active | paused | completed`
  - `message`: (optional string)
  - `time`: (optional HH:mm)

---

## 6. Health Check
- **Endpoint**: `GET /health` (No `/api` prefix)
