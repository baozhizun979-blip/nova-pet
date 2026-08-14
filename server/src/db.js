const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.NOVA_DB_PATH || path.join(__dirname, '..', 'data', 'nova.db');
const db = new Database(DB_PATH);

function migrate() {
  // create tables if not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS identities (
      novaId TEXT PRIMARY KEY,
      telegramId TEXT,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS pets (
      petId TEXT PRIMARY KEY,
      owner TEXT,
      stage TEXT,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS actions (
      actionId TEXT PRIMARY KEY,
      novaId TEXT,
      actionType TEXT,
      payload TEXT,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novaId TEXT,
      taskId TEXT,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      orderId TEXT PRIMARY KEY,
      novaId TEXT,
      sku TEXT,
      quantity INTEGER,
      status TEXT,
      createdAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      createdAt INTEGER
    );
  `);
}

function ensureIdempotency(key) {
  if (!key) return false;
  const row = db.prepare('SELECT key FROM idempotency_keys WHERE key = ?').get(key);
  if (row) return true;
  db.prepare('INSERT INTO idempotency_keys(key, createdAt) VALUES(?, ?)').run(key, Date.now());
  return false;
}

module.exports = { db, migrate, ensureIdempotency };
