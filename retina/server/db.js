import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.RETINA_DATA_DIR || path.resolve(import.meta.dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
export const DB_PATH = path.join(DATA_DIR, 'retina.db');

export const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  webhook_token TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  visitor_id TEXT,
  started_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  url TEXT, path TEXT, title TEXT, referrer TEXT, ref_host TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  device TEXT, os TEXT, browser TEXT, country TEXT, lang TEXT,
  vw INTEGER, vh INTEGER, load_ms INTEGER,
  is_bot INTEGER DEFAULT 0, is_returning INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0, engaged_ms INTEGER DEFAULT 0,
  max_scroll REAL DEFAULT 0, doc_h INTEGER,
  cur_section TEXT, layout TEXT,
  clicks INTEGER DEFAULT 0, rage_clicks INTEGER DEFAULT 0, dead_clicks INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0, checkout_clicks INTEGER DEFAULT 0,
  exit_intent INTEGER DEFAULT 0, popups INTEGER DEFAULT 0, finished INTEGER DEFAULT 0,
  converted INTEGER DEFAULT 0, revenue REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_site_time ON sessions(site_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions(site_id, last_seen);

CREATE TABLE IF NOT EXISTS session_sections (
  session_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  section TEXT NOT NULL,
  ord INTEGER, reached INTEGER, first_t INTEGER,
  dwell_ms INTEGER, still_ms INTEGER, moving_s INTEGER, scroll_vh REAL, rereads INTEGER,
  attention TEXT,
  PRIMARY KEY (session_id, section)
);
CREATE INDEX IF NOT EXISTS idx_ss_site ON session_sections(site_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  t INTEGER,
  type TEXT NOT NULL,
  section TEXT,
  x REAL, y REAL,
  label TEXT,
  data TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_site_type ON events(site_id, type, ts);

CREATE TABLE IF NOT EXISTS traces (
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  points TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_traces_session ON traces(session_id);

CREATE TABLE IF NOT EXISTS conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  session_id TEXT,
  tx_id TEXT,
  value REAL DEFAULT 0,
  currency TEXT,
  status TEXT,
  product TEXT,
  source TEXT,
  raw TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_tx ON conversions(site_id, tx_id) WHERE tx_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conv_site ON conversions(site_id, created_at);
`);

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}
export function setSetting(key, value) {
  db.prepare('INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

export function token(n = 24) {
  return crypto.randomBytes(n).toString('base64url');
}

export function createSite(name, url, id) {
  const siteId = id || name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) + '-' + token(3).toLowerCase().replace(/[^a-z0-9]/g, 'x');
  db.prepare('INSERT INTO sites(id, name, url, webhook_token, created_at) VALUES (?, ?, ?, ?, ?)').run(siteId, name, url || null, token(18), Date.now());
  return db.prepare('SELECT * FROM sites WHERE id = ?').get(siteId);
}

// Na primeira execução: cria a senha do painel e um site de demonstração
export function bootstrap() {
  if (!getSetting('secret')) setSetting('secret', token(32));
  if (!process.env.RETINA_PASSWORD && !getSetting('password')) setSetting('password', token(9));
  const count = db.prepare('SELECT COUNT(*) AS n FROM sites').get().n;
  if (!count) createSite('Página Madeira (demo)', process.env.RETINA_DEMO_URL || 'http://localhost:4000/', 'demo');
}

export function dbSizeBytes() {
  let total = 0;
  for (const f of [DB_PATH, DB_PATH + '-wal', DB_PATH + '-shm']) {
    try { total += fs.statSync(f).size; } catch {}
  }
  return total;
}
