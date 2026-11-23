const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'phone2tv.db');
const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  PRAGMA journal_mode = WAL;
  
  CREATE TABLE IF NOT EXISTS sessions (
    code TEXT PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_code TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    title TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    sender_device TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(session_code) REFERENCES sessions(code) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_code);
  CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(last_active);
`);

const stmtGetSession = db.prepare('SELECT * FROM sessions WHERE code = ?');
const stmtCreateSession = db.prepare('INSERT INTO sessions (code, session_id, created_at, last_active) VALUES (?, ?, ?, ?)');
const stmtTouchSession = db.prepare('UPDATE sessions SET last_active = ? WHERE code = ?');
const stmtGetMessages = db.prepare('SELECT * FROM messages WHERE session_code = ? ORDER BY created_at ASC');
const stmtInsertMessage = db.prepare(`
  INSERT INTO messages (id, session_code, type, content, title, file_name, file_size, file_type, sender_device, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const stmtDeleteMessage = db.prepare('DELETE FROM messages WHERE id = ? AND session_code = ?');
const stmtClearSessionMessages = db.prepare('DELETE FROM messages WHERE session_code = ?');
const stmtGetSessionFileMessages = db.prepare("SELECT content FROM messages WHERE session_code = ? AND type IN ('image', 'file')");
const stmtGetOldSessions = db.prepare('SELECT code FROM sessions WHERE last_active < ?');
const stmtDeleteSession = db.prepare('DELETE FROM sessions WHERE code = ?');

const dbService = {
  getOrCreateSession(code, sessionId = null) {
    const existing = stmtGetSession.get(code);
    const now = Date.now();
    if (existing) {
      stmtTouchSession.run(now, code);
      return existing;
    }
    const id = sessionId || require('crypto').randomUUID();
    stmtCreateSession.run(code, id, now, now);
    return { code, session_id: id, created_at: now, last_active: now };
  },

  getSession(code) {
    return stmtGetSession.get(code);
  },

  touchSession(code) {
    stmtTouchSession.run(Date.now(), code);
  },

  getMessages(code) {
    return stmtGetMessages.all(code);
  },

  addMessage({ id, session_code, type, content, title = null, file_name = null, file_size = null, file_type = null, sender_device = 'unknown' }) {
    const now = Date.now();
    stmtInsertMessage.run(
      id,
      session_code,
      type,
      content,
      title,
      file_name,
      file_size,
      file_type,
      sender_device,
      now
    );
    stmtTouchSession.run(now, session_code);
    return {
      id,
      session_code,
      type,
      content,
      title,
      file_name,
      file_size,
      file_type,
      sender_device,
      created_at: now
    };
  },

  deleteMessage(id, session_code) {
    const res = stmtDeleteMessage.run(id, session_code);
    return res.changes > 0;
  },

  clearSession(code, uploadsDir = null) {
    if (uploadsDir && fs.existsSync(uploadsDir)) {
      const fileMsgs = stmtGetSessionFileMessages.all(code);
      for (const msg of fileMsgs) {
        try {
          if (msg.content && msg.content.startsWith('/uploads/')) {
            const filename = path.basename(msg.content);
            const fullPath = path.join(uploadsDir, filename);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
        } catch (e) {
          console.error('Error removing file:', e);
        }
      }
    }
    stmtClearSessionMessages.run(code);
  },

  cleanupOldSessions(maxAgeMs = 24 * 60 * 60 * 1000, uploadsDir = null) {
    const cutoff = Date.now() - maxAgeMs;
    const oldSessions = stmtGetOldSessions.all(cutoff);
    for (const session of oldSessions) {
      this.clearSession(session.code, uploadsDir);
      stmtDeleteSession.run(session.code);
    }
    return oldSessions.length;
  }
};

module.exports = dbService;
