import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.DATA_DIR || path.resolve(import.meta.dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
export const DB_PATH = path.join(DATA_DIR, 'membros.db');

export const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at INTEGER NOT NULL,
  last_login INTEGER,
  last_seen INTEGER
);

-- Cada compra aprovada libera um produto; reembolso/chargeback revoga.
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  product_id TEXT NOT NULL,
  tx_id TEXT,
  status TEXT NOT NULL,              -- approved | refunded | pending
  value REAL DEFAULT 0,
  source TEXT,                       -- webhook | manual | simulate
  click_id TEXT,                     -- clique em oferta que gerou a compra (atribuição)
  offer_id TEXT,
  placement TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_tx ON purchases(customer_id, tx_id, product_id) WHERE tx_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_customer ON purchases(customer_id);

CREATE TABLE IF NOT EXISTS login_tokens (
  hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  hash TEXT PRIMARY KEY,
  customer_id TEXT,                  -- NULL = sessão do painel admin
  is_admin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Progresso por arquivo ("deliverable" ou "deliverable/parte")
CREATE TABLE IF NOT EXISTS progress (
  customer_id TEXT NOT NULL REFERENCES customers(id),
  ref TEXT NOT NULL,
  opened_at INTEGER,
  last_page INTEGER,
  pages INTEGER,
  done_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (customer_id, ref)
);

-- impression | open | click | purchase
CREATE TABLE IF NOT EXISTS offer_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT,
  offer_id TEXT NOT NULL,
  placement TEXT,
  ref TEXT,
  type TEXT NOT NULL,
  click_id TEXT,
  value REAL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oe_offer ON offer_events(offer_id, type, ts);
CREATE INDEX IF NOT EXISTS idx_oe_customer ON offer_events(customer_id, type, ts);
CREATE UNIQUE INDEX IF NOT EXISTS idx_oe_click ON offer_events(click_id) WHERE type = 'click';

CREATE TABLE IF NOT EXISTS webhook_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  ok INTEGER,
  summary TEXT,
  body TEXT
);
`);

export function setting(key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  if (row) return row.value;
  if (fallback === undefined) return null;
  const v = typeof fallback === 'function' ? fallback() : fallback;
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, v);
  return v;
}

export const randomId = (bytes = 16) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
