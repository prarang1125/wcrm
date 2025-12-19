const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT,
    participant_count INTEGER,
    auto_reply INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS scheduled_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target TEXT NOT NULL,
    message TEXT,
    url TEXT,
    start_date TEXT NOT NULL,
    time TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('once', 'daily', 'weekly')),
    week_days TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    enhance_ai INTEGER DEFAULT 0,
    context TEXT,
    last_run_at TEXT,
    next_run_at TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_next_run ON scheduled_messages(next_run_at, status);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

console.log('Database initialized with production scheduler schema');

module.exports = db;
