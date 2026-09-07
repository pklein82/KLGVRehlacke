'use strict';

const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'rehlacke.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'editor',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    nav_title   TEXT NOT NULL DEFAULT '',
    intro       TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL DEFAULT '',
    section     TEXT NOT NULL DEFAULT 'verein',
    position    INTEGER NOT NULL DEFAULT 0,
    in_nav      INTEGER NOT NULL DEFAULT 1,
    published   INTEGER NOT NULL DEFAULT 1,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    excerpt      TEXT NOT NULL DEFAULT '',
    body         TEXT NOT NULL DEFAULT '',
    image        TEXT NOT NULL DEFAULT '',
    pinned       INTEGER NOT NULL DEFAULT 0,
    published    INTEGER NOT NULL DEFAULT 1,
    published_at TEXT NOT NULL DEFAULT (date('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    starts_at   TEXT NOT NULL,
    ends_at     TEXT NOT NULL DEFAULT '',
    all_day     INTEGER NOT NULL DEFAULT 0,
    location    TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    published   INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS board (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    role     TEXT NOT NULL DEFAULT '',
    email    TEXT NOT NULL DEFAULT '',
    phone    TEXT NOT NULL DEFAULT '',
    note     TEXT NOT NULL DEFAULT '',
    photo    TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS documents (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    file        TEXT NOT NULL DEFAULT '',
    link        TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'Allgemein',
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    kind       TEXT NOT NULL DEFAULT 'biete',
    title      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    contact    TEXT NOT NULL DEFAULT '',
    parcel     TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    phone      TEXT NOT NULL DEFAULT '',
    parcel     TEXT NOT NULL DEFAULT '',
    subject    TEXT NOT NULL DEFAULT '',
    body       TEXT NOT NULL DEFAULT '',
    handled    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS media (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    file       TEXT NOT NULL,
    original   TEXT NOT NULL DEFAULT '',
    mime       TEXT NOT NULL DEFAULT '',
    size       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_news_date     ON news (published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_events_start  ON events (starts_at);
  CREATE INDEX IF NOT EXISTS idx_pages_section ON pages (section, position);
`);

/* ---------- Settings helpers ---------- */

const SETTING_DEFAULTS = {
  site_title: 'KGV An der Rehlacke',
  site_subtitle: 'Kleingartenverein in 1220 Wien',
  brand_pre: 'Kleingartenverein',
  brand_name: '\u201eAn der Rehlacke\u201c',
  brand_claim: 'Natur verbindet',
  hero_kicker: 'Kleingartenverein in der Donaustadt',
  hero_title: 'Herzlich willkommen beim KGV An der Rehlacke',
  hero_text:
    'Die Kleingartenanlage An der Rehlacke liegt in der Wiener Donaustadt. '
    + 'Auf diesen Seiten finden unsere Mitglieder Termine, Ruhezeiten, Kosten, '
    + 'Beschlüsse und alle Unterlagen des Vereins.',
  hero_image: '',
  club_name: 'Kleingarten Verein an der Rehlacke',
  street: 'Benatzkygasse 3, Tor 1, Parzelle 1',
  zip: '1220',
  city: 'Wien',
  phone: '0699 116 70 583',
  email: 'michael.stocker@aon.at',
  zvr: '968 877 975',
  office_hours:
    'Sprechstunden sind jederzeit nach persönlicher oder telefonischer '
    + 'Voranmeldung möglich – Telefon 0699 116 70 583.',
  map_query: 'Benatzkygasse 3, 1220 Wien',
  footer_note: 'Mitglied im Zentralverband der Kleingärtner und Siedler Österreichs.',
  flohmarkt_intro:
    'Hier können Sie alles anbieten, was Sie nicht mehr brauchen – oder suchen, '
    + 'was Sie dringend brauchen. Anfragen zur Verfügbarkeit von Kleingärten sind '
    + 'wegen der langen Warteliste leider aussichtslos.',
};

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = { ...SETTING_DEFAULTS };
  for (const row of rows) out[row.key] = row.value;
  return out;
}

const setSettingStmt = db.prepare(
  'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
);

function setSettings(values) {
  const tx = db.transaction((pairs) => {
    for (const [key, value] of pairs) setSettingStmt.run(key, String(value ?? ''));
  });
  tx(Object.entries(values));
}

module.exports = { db, getSettings, setSettings, SETTING_DEFAULTS };
