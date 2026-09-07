'use strict';

const { Store } = require('express-session');

/**
 * Minimal session store on top of the existing better-sqlite3 connection,
 * so the app needs no second SQLite driver.
 */
class SqliteStore extends Store {
  constructor(db, { cleanupIntervalMs = 15 * 60 * 1000 } = {}) {
    super();
    this.stmt = {
      get: db.prepare('SELECT data FROM sessions WHERE sid = ? AND expires_at > ?'),
      set: db.prepare(
        `INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at`,
      ),
      destroy: db.prepare('DELETE FROM sessions WHERE sid = ?'),
      touch: db.prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?'),
      clear: db.prepare('DELETE FROM sessions'),
      length: db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?'),
      prune: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    };
    this.timer = setInterval(() => this.prune(), cleanupIntervalMs);
    this.timer.unref();
    this.prune();
  }

  expiry(session) {
    const ms = session?.cookie?.maxAge ?? 24 * 60 * 60 * 1000;
    return Date.now() + ms;
  }

  prune() {
    try {
      this.stmt.prune.run(Date.now());
    } catch { /* best effort */ }
  }

  get(sid, cb) {
    try {
      const row = this.stmt.get.get(sid, Date.now());
      cb(null, row ? JSON.parse(row.data) : null);
    } catch (err) {
      cb(err);
    }
  }

  set(sid, session, cb) {
    try {
      this.stmt.set.run(sid, JSON.stringify(session), this.expiry(session));
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  touch(sid, session, cb) {
    try {
      this.stmt.touch.run(this.expiry(session), sid);
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  destroy(sid, cb) {
    try {
      this.stmt.destroy.run(sid);
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  clear(cb) {
    try {
      this.stmt.clear.run();
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  length(cb) {
    try {
      cb(null, this.stmt.length.get(Date.now()).n);
    } catch (err) {
      cb(err);
    }
  }
}

module.exports = SqliteStore;
