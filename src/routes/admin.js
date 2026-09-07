'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const bcrypt = require('bcryptjs');

const { db, getSettings, setSettings, SETTING_DEFAULTS } = require('../db');
const RESOURCES = require('../resources');
const { upload, UPLOAD_DIR } = require('../uploads');
const { slugify, safeRedirect, renderMarkdown } = require('../helpers');
const { verify } = require('../csrf');
const RESERVED_SLUGS = require('../reserved-slugs');

const router = express.Router();

/*
 * Formulare mit Datei-Upload kommen als multipart/form-data an und werden von
 * Multer geparst; erst danach kann das CSRF-Token geprüft werden.
 */
function parseMultipart(req, res, next) {
  const type = req.headers['content-type'] || '';
  if (!type.startsWith('multipart/form-data')) return next();
  return upload.any()(req, res, next);
}

router.use(parseMultipart, verify);

/* ---------- Zugriffsschutz ---------- */

function requireLogin(req, res, next) {
  if (req.session.user) return next();
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
}

router.use((req, res, next) => {
  res.locals.layout = 'admin';
  res.locals.resources = RESOURCES;
  res.locals.adminSection = '';
  next();
});

/* ---------- Anmeldung ---------- */

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  return res.render('admin/login', { title: 'Anmelden', error: null, email: '' });
});

router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email);
  const ok = user && bcrypt.compareSync(password, user.password);

  if (!ok) {
    return res.status(401).render('admin/login', {
      title: 'Anmelden',
      error: 'E-Mail-Adresse oder Kennwort ist nicht korrekt.',
      email: req.body.email || '',
    });
  }

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  const target = safeRedirect(req.session.returnTo, '/admin');

  // Session-Fixierung vermeiden: neue Session-ID nach dem Login.
  return req.session.regenerate((err) => {
    if (err) {
      console.error(err);
      return res.status(500).render('admin/login', {
        title: 'Anmelden', error: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.', email: '',
      });
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.redirect(target);
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

router.use(requireLogin);

/* Zähler für die Hinweisplaketten in der Seitenleiste. */
router.use((req, res, next) => {
  res.locals.pendingCount = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE status = 'pending'").get().n;
  res.locals.messageCount = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE handled = 0').get().n;
  next();
});

/* ---------- Übersicht ---------- */

router.get('/', (req, res) => {
  const counts = {};
  for (const [key, def] of Object.entries(RESOURCES)) {
    counts[key] = db.prepare(`SELECT COUNT(*) AS n FROM ${def.table}`).get().n;
  }

  res.render('admin/dashboard', {
    title: 'Übersicht',
    adminSection: 'dashboard',
    counts,
    pendingListings: db.prepare("SELECT COUNT(*) AS n FROM listings WHERE status = 'pending'").get().n,
    newMessages: db.prepare('SELECT COUNT(*) AS n FROM messages WHERE handled = 0').get().n,
    recentNews: db.prepare('SELECT id, title, published_at, published FROM news ORDER BY published_at DESC LIMIT 5').all(),
    nextEvents: db.prepare(
      "SELECT id, title, starts_at, all_day FROM events WHERE date(starts_at) >= date('now') ORDER BY starts_at LIMIT 5",
    ).all(),
  });
});

/* ---------- Nachrichten aus dem Kontaktformular ---------- */

router.get('/nachrichten', (req, res) => {
  res.render('admin/messages', {
    title: 'Nachrichten',
    adminSection: 'nachrichten',
    messages: db.prepare('SELECT * FROM messages ORDER BY handled, created_at DESC').all(),
  });
});

router.post('/nachrichten/:id/erledigt', (req, res) => {
  db.prepare('UPDATE messages SET handled = 1 - handled WHERE id = ?').run(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'Status der Nachricht geändert.' };
  res.redirect('/admin/nachrichten');
});

router.post('/nachrichten/:id/loeschen', (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'Nachricht gelöscht.' };
  res.redirect('/admin/nachrichten');
});

/* ---------- Einstellungen ---------- */

const SETTING_GROUPS = [
  {
    title: 'Website',
    fields: [
      { key: 'site_title', label: 'Name der Website', type: 'text' },
      { key: 'site_subtitle', label: 'Untertitel', type: 'text' },
      { key: 'footer_note', label: 'Hinweis im Fußbereich', type: 'textarea' },
    ],
  },
  {
    title: 'Startseite',
    fields: [
      { key: 'hero_kicker', label: 'Kleine Überschrift', type: 'text' },
      { key: 'hero_title', label: 'Große Überschrift', type: 'text' },
      { key: 'hero_text', label: 'Einleitungstext', type: 'textarea', rows: 5 },
    ],
  },
  {
    title: 'Verein und Kontakt',
    fields: [
      { key: 'club_name', label: 'Vollständiger Vereinsname', type: 'text' },
      { key: 'street', label: 'Adresse', type: 'text' },
      { key: 'zip', label: 'PLZ', type: 'text', width: 'half' },
      { key: 'city', label: 'Ort', type: 'text', width: 'half' },
      { key: 'phone', label: 'Telefon', type: 'text', width: 'half' },
      { key: 'email', label: 'E-Mail', type: 'text', width: 'half' },
      { key: 'zvr', label: 'ZVR-Zahl', type: 'text', width: 'half' },
      { key: 'office_hours', label: 'Sprechstunde', type: 'textarea', rows: 2 },
    ],
  },
  {
    title: 'Ich biete / Ich suche',
    fields: [
      { key: 'flohmarkt_intro', label: 'Einleitungstext', type: 'textarea', rows: 4 },
    ],
  },
];

router.get('/einstellungen', (req, res) => {
  res.render('admin/settings', {
    title: 'Einstellungen',
    adminSection: 'einstellungen',
    groups: SETTING_GROUPS,
    values: getSettings(),
  });
});

router.post('/einstellungen', (req, res) => {
  const allowed = new Set(Object.keys(SETTING_DEFAULTS));
  const values = {};
  for (const group of SETTING_GROUPS) {
    for (const field of group.fields) {
      if (allowed.has(field.key)) values[field.key] = String(req.body[field.key] ?? '').slice(0, 2000);
    }
  }
  setSettings(values);
  req.session.flash = { type: 'success', text: 'Einstellungen gespeichert.' };
  res.redirect('/admin/einstellungen');
});

/* ---------- Konto ---------- */

router.get('/konto', (req, res) => {
  res.render('admin/account', {
    title: 'Konto',
    adminSection: 'konto',
    user: db.prepare('SELECT id, name, email, role, last_login FROM users WHERE id = ?').get(req.session.user.id),
    errors: [],
  });
});

router.post('/konto', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  const name = String(req.body.name || '').trim().slice(0, 120);
  const email = String(req.body.email || '').trim().slice(0, 160);
  const current = String(req.body.current_password || '');
  const next = String(req.body.new_password || '');
  const repeat = String(req.body.repeat_password || '');

  const errors = [];
  if (name.length < 2) errors.push('Bitte geben Sie einen Namen an.');
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse an.');

  const wantsNewPassword = next.length > 0;
  if (wantsNewPassword) {
    if (!bcrypt.compareSync(current, user.password)) errors.push('Das aktuelle Kennwort ist nicht korrekt.');
    if (next.length < 10) errors.push('Das neue Kennwort muss mindestens 10 Zeichen lang sein.');
    if (next !== repeat) errors.push('Die beiden neuen Kennwörter stimmen nicht überein.');
  }

  const emailTaken = db.prepare('SELECT 1 FROM users WHERE lower(email) = ? AND id != ?')
    .get(email.toLowerCase(), user.id);
  if (emailTaken) errors.push('Diese E-Mail-Adresse wird bereits verwendet.');

  if (errors.length) {
    return res.status(400).render('admin/account', {
      title: 'Konto',
      adminSection: 'konto',
      user: { ...user, name, email },
      errors,
    });
  }

  if (wantsNewPassword) {
    db.prepare('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?')
      .run(name, email, bcrypt.hashSync(next, 10), user.id);
  } else {
    db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, user.id);
  }

  req.session.user = { ...req.session.user, name, email };
  req.session.flash = {
    type: 'success',
    text: wantsNewPassword ? 'Konto und Kennwort aktualisiert.' : 'Konto aktualisiert.',
  };
  return res.redirect('/admin/konto');
});

/* ---------- Medien ---------- */

router.get('/medien', (req, res) => {
  res.render('admin/media', {
    title: 'Medien',
    adminSection: 'medien',
    items: db.prepare('SELECT * FROM media ORDER BY created_at DESC, id DESC').all(),
  });
});

router.post('/medien', (req, res) => {
  const insert = db.prepare(
    'INSERT INTO media (file, original, mime, size) VALUES (?, ?, ?, ?)',
  );
  const tx = db.transaction((files) => {
    for (const file of files) insert.run(`/uploads/${file.filename}`, file.originalname, file.mimetype, file.size);
  });
  tx(req.files || []);

  req.session.flash = {
    type: 'success',
    text: `${(req.files || []).length} Datei(en) hochgeladen.`,
  };
  res.redirect('/admin/medien');
});

router.post('/medien/:id/loeschen', (req, res) => {
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(Number(req.params.id));
  if (item) {
    // Nur Dateien im Upload-Ordner löschen – niemals einen anderen Pfad.
    const target = path.join(UPLOAD_DIR, path.basename(item.file));
    if (target.startsWith(UPLOAD_DIR)) fs.rmSync(target, { force: true });
    db.prepare('DELETE FROM media WHERE id = ?').run(item.id);
  }
  req.session.flash = { type: 'success', text: 'Datei gelöscht.' };
  res.redirect('/admin/medien');
});

/* ---------- Generische Inhaltsverwaltung ---------- */

function resourceOr404(req, res) {
  const def = RESOURCES[req.params.resource];
  if (!def) {
    res.status(404).render('error', {
      title: 'Nicht gefunden', heading: '404', message: 'Dieser Bereich existiert nicht.',
    });
    return null;
  }
  return def;
}

/** Formularwerte in Spaltenwerte übersetzen (inkl. Uploads und Slug-Erzeugung). */
function collectValues(def, body, files, existing) {
  const values = {};
  const uploaded = new Map((files || []).map((f) => [f.fieldname, f]));

  for (const field of def.fields) {
    const file = uploaded.get(`upload_${field.key}`);

    if ((field.type === 'image' || field.type === 'file') && body[`${field.key}__clear`] && !file) {
      values[field.key] = '';
      continue;
    }

    if (file && (field.type === 'image' || field.type === 'file')) {
      values[field.key] = `/uploads/${file.filename}`;
      db.prepare('INSERT INTO media (file, original, mime, size) VALUES (?, ?, ?, ?)')
        .run(`/uploads/${file.filename}`, file.originalname, file.mimetype, file.size);
      continue;
    }

    switch (field.type) {
      case 'checkbox':
        values[field.key] = body[field.key] ? 1 : 0;
        break;
      case 'number': {
        const n = Number.parseInt(body[field.key], 10);
        values[field.key] = Number.isFinite(n) ? n : (field.default ?? 0);
        break;
      }
      case 'select': {
        const allowed = field.options.map((o) => o.value);
        values[field.key] = allowed.includes(body[field.key]) ? body[field.key] : (field.default ?? allowed[0]);
        break;
      }
      default: {
        let value = String(body[field.key] ?? '').trim();
        if (field.maxlength) value = value.slice(0, field.maxlength);
        values[field.key] = value;
      }
    }
  }

  if (def.slugFrom) {
    const raw = values.slug || values[def.slugFrom] || existing?.[def.slugFrom] || '';
    let base = slugify(raw);
    // Feste Routen gewinnen gegen CMS-Seiten – solche Kürzel daher ausweichen.
    if (def.table === 'pages' && RESERVED_SLUGS.has(base)) base = `${base}-seite`;
    values.slug = uniqueSlug(def.table, base, existing?.id);
  }

  return values;
}

function uniqueSlug(table, base, ignoreId) {
  let candidate = base;
  for (let i = 2; i < 200; i += 1) {
    const clash = ignoreId
      ? db.prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`).get(candidate, ignoreId)
      : db.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`).get(candidate);
    if (!clash) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function validate(def, values) {
  const errors = [];
  for (const field of def.fields) {
    if (field.required && !String(values[field.key] ?? '').trim()) {
      errors.push(`Bitte „${field.label}“ ausfüllen.`);
    }
  }
  return errors;
}

/* Liste */
router.get('/inhalt/:resource', (req, res) => {
  const def = resourceOr404(req, res);
  if (!def) return undefined;

  return res.render('admin/list', {
    title: def.label,
    adminSection: req.params.resource,
    resource: req.params.resource,
    def,
    rows: db.prepare(`SELECT * FROM ${def.table} ORDER BY ${def.order}`).all(),
  });
});

/* Neuer Eintrag */
router.get('/inhalt/:resource/neu', (req, res) => {
  const def = resourceOr404(req, res);
  if (!def) return undefined;

  const row = {};
  for (const field of def.fields) {
    row[field.key] = field.default ?? (field.type === 'checkbox' || field.type === 'number' ? 0 : '');
  }
  if (def.fields.some((f) => f.key === 'published_at')) {
    row.published_at = new Date().toISOString().slice(0, 10);
  }

  return res.render('admin/form', {
    title: `${def.singular} anlegen`,
    adminSection: req.params.resource,
    resource: req.params.resource,
    def,
    row,
    isNew: true,
    errors: [],
  });
});

/* Bearbeiten */
router.get('/inhalt/:resource/:id', (req, res, next) => {
  const def = resourceOr404(req, res);
  if (!def) return undefined;

  const row = db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(Number(req.params.id));
  if (!row) return next();

  return res.render('admin/form', {
    title: `${def.singular} bearbeiten`,
    adminSection: req.params.resource,
    resource: req.params.resource,
    def,
    row,
    isNew: false,
    errors: [],
  });
});

/* Speichern (anlegen und bearbeiten teilen dieselbe Logik) */
function saveResource(req, res) {
  const def = resourceOr404(req, res);
  if (!def) return undefined;

  const id = req.params.id ? Number(req.params.id) : null;
  const existing = id ? db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(id) : null;
  const values = collectValues(def, req.body, req.files, existing);
  const errors = validate(def, values);

  if (errors.length) {
    return res.status(400).render('admin/form', {
      title: id ? `${def.singular} bearbeiten` : `${def.singular} anlegen`,
      adminSection: req.params.resource,
      resource: req.params.resource,
      def,
      row: { ...(existing || {}), ...values, id },
      isNew: !id,
      errors,
    });
  }

  const cols = Object.keys(values);
  if (def.touch) {
    values[def.touch] = new Date().toISOString().slice(0, 19).replace('T', ' ');
    cols.push(def.touch);
  }

  if (existing) {
    db.prepare(
      `UPDATE ${def.table} SET ${cols.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`,
    ).run({ ...values, id: existing.id });
    req.session.flash = { type: 'success', text: `${def.singular} gespeichert.` };
  } else {
    const info = db.prepare(
      `INSERT INTO ${def.table} (${cols.join(', ')}) VALUES (${cols.map((c) => `@${c}`).join(', ')})`,
    ).run(values);
    req.session.flash = { type: 'success', text: `${def.singular} angelegt.` };
    return res.redirect(`/admin/inhalt/${req.params.resource}/${info.lastInsertRowid}`);
  }

  return res.redirect(`/admin/inhalt/${req.params.resource}/${existing.id}`);
}

router.post('/inhalt/:resource', saveResource);
router.post('/inhalt/:resource/:id', saveResource);

/* Löschen */
router.post('/inhalt/:resource/:id/loeschen', (req, res) => {
  const def = resourceOr404(req, res);
  if (!def) return undefined;

  db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).run(Number(req.params.id));
  req.session.flash = { type: 'success', text: `${def.singular} gelöscht.` };
  return res.redirect(`/admin/inhalt/${req.params.resource}`);
});

/* Vorschau der Markdown-Eingabe (wird per fetch aus dem Editor aufgerufen) */
router.post('/vorschau', (req, res) => {
  res.type('html').send(renderMarkdown(String(req.body.text || '').slice(0, 50000)));
});

module.exports = router;
