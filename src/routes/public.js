'use strict';

const express = require('express');
const { db } = require('../db');
const { renderMarkdown, plainText } = require('../helpers');

const router = express.Router();

const RESERVED = require('../reserved-slugs');

const q = {
  newsList: db.prepare(
    `SELECT * FROM news WHERE published = 1
      ORDER BY pinned DESC, published_at DESC, id DESC LIMIT ? OFFSET ?`,
  ),
  newsCount: db.prepare('SELECT COUNT(*) AS n FROM news WHERE published = 1'),
  newsBySlug: db.prepare('SELECT * FROM news WHERE slug = ? AND published = 1'),
  upcomingEvents: db.prepare(
    `SELECT * FROM events WHERE published = 1 AND date(starts_at) >= date('now')
      ORDER BY starts_at LIMIT ?`,
  ),
  pastEvents: db.prepare(
    `SELECT * FROM events WHERE published = 1 AND date(starts_at) < date('now')
      ORDER BY starts_at DESC LIMIT 12`,
  ),
  pageBySlug: db.prepare('SELECT * FROM pages WHERE slug = ? AND published = 1'),
  pagesBySection: db.prepare(
    `SELECT slug, title, nav_title, intro FROM pages
      WHERE published = 1 AND in_nav = 1 AND section = ? ORDER BY position, title`,
  ),
  board: db.prepare('SELECT * FROM board ORDER BY position, name'),
  documents: db.prepare('SELECT * FROM documents ORDER BY category, position, title'),
  listings: db.prepare("SELECT * FROM listings WHERE status = 'published' ORDER BY created_at DESC"),
};

/* ---------- Start ---------- */

router.get('/', (req, res) => {
  const news = q.newsList.all(3, 0);
  res.render('home', {
    title: '',
    description: plainText(res.locals.settings.hero_text, 155),
    bodyClass: 'is-home',
    news,
    events: q.upcomingEvents.all(4),
    highlights: q.pagesBySection.all('verein'),
    services: q.pagesBySection.all('service'),
  });
});

/* ---------- Aktuelles ---------- */

router.get('/aktuelles', (req, res) => {
  const perPage = 6;
  const total = q.newsCount.get().n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, Number.parseInt(req.query.seite, 10) || 1), pages);

  res.render('news-list', {
    title: 'Aktuelles',
    description: 'Neuigkeiten und Mitteilungen aus dem Kleingartenverein An der Rehlacke.',
    news: q.newsList.all(perPage, (page - 1) * perPage),
    page,
    pages,
    total,
  });
});

router.get('/aktuelles/:slug', (req, res, next) => {
  const item = q.newsBySlug.get(req.params.slug);
  if (!item) return next();

  return res.render('news-single', {
    title: item.title,
    description: plainText(item.excerpt || item.body, 155),
    item,
    html: renderMarkdown(item.body),
    more: db.prepare(
      `SELECT slug, title, published_at, excerpt FROM news
        WHERE published = 1 AND id != ? ORDER BY published_at DESC LIMIT 3`,
    ).all(item.id),
  });
});

/* ---------- Termine ---------- */

router.get('/termine', (req, res) => {
  res.render('events', {
    title: 'Termine',
    description: 'Alle Termine und Veranstaltungen des Kleingartenvereins An der Rehlacke.',
    upcoming: q.upcomingEvents.all(50),
    past: q.pastEvents.all(),
  });
});

/* ---------- Vereinsleitung ---------- */

router.get('/vereinsleitung', (req, res) => {
  res.render('board', {
    title: 'Vereinsleitung',
    description: 'Die Funktionen der Vereinsleitung des KGV An der Rehlacke und ihre Erreichbarkeit.',
    board: q.board.all(),
  });
});

/* ---------- Downloads ---------- */

router.get('/downloads', (req, res) => {
  const docs = q.documents.all();
  const groups = new Map();
  for (const doc of docs) {
    if (!groups.has(doc.category)) groups.set(doc.category, []);
    groups.get(doc.category).push(doc);
  }

  res.render('documents', {
    title: 'Downloads',
    description: 'Statuten, Gartenordnung, Beschlüsse und Formulare zum Herunterladen.',
    groups: [...groups.entries()],
    total: docs.length,
  });
});

/* ---------- Ich biete / Ich suche ---------- */

router.get('/flohmarkt', (req, res) => {
  const all = q.listings.all();
  res.render('listings', {
    title: 'Ich biete / Ich suche',
    description: 'Anzeigen von Mitgliedern: Pflanzen, Werkzeug und Gartenzubehör anbieten oder suchen.',
    offers: all.filter((l) => l.kind === 'biete'),
    wants: all.filter((l) => l.kind === 'suche'),
    form: {},
    errors: [],
  });
});

router.post('/flohmarkt', (req, res) => {
  const form = {
    kind: req.body.kind === 'suche' ? 'suche' : 'biete',
    title: String(req.body.title || '').trim().slice(0, 120),
    body: String(req.body.body || '').trim().slice(0, 2000),
    contact: String(req.body.contact || '').trim().slice(0, 160),
    parcel: String(req.body.parcel || '').trim().slice(0, 40),
  };

  const errors = [];
  if (form.title.length < 3) errors.push('Bitte geben Sie einen Titel an.');
  if (form.body.length < 10) errors.push('Bitte beschreiben Sie Ihre Anzeige etwas genauer.');
  if (form.contact.length < 3) errors.push('Bitte geben Sie an, wie man Sie erreichen kann.');

  if (errors.length) {
    const all = q.listings.all();
    return res.status(400).render('listings', {
      title: 'Ich biete / Ich suche',
      description: '',
      offers: all.filter((l) => l.kind === 'biete'),
      wants: all.filter((l) => l.kind === 'suche'),
      form,
      errors,
    });
  }

  db.prepare(
    `INSERT INTO listings (kind, title, body, contact, parcel, status)
     VALUES (@kind, @title, @body, @contact, @parcel, 'pending')`,
  ).run(form);

  req.session.flash = {
    type: 'success',
    text: 'Danke! Ihre Anzeige wurde übermittelt und erscheint nach der Prüfung durch die Vereinsleitung.',
  };
  return res.redirect('/flohmarkt');
});

/* ---------- Kontakt ---------- */

router.get('/kontakt', (req, res) => {
  res.render('contact', {
    title: 'Kontakt',
    description: 'So erreichen Sie die Vereinsleitung des KGV An der Rehlacke.',
    form: {},
    errors: [],
  });
});

router.post('/kontakt', (req, res) => {
  const form = {
    name: String(req.body.name || '').trim().slice(0, 120),
    email: String(req.body.email || '').trim().slice(0, 160),
    phone: String(req.body.phone || '').trim().slice(0, 60),
    parcel: String(req.body.parcel || '').trim().slice(0, 40),
    subject: String(req.body.subject || '').trim().slice(0, 160),
    body: String(req.body.body || '').trim().slice(0, 4000),
  };

  const errors = [];
  if (form.name.length < 2) errors.push('Bitte geben Sie Ihren Namen an.');
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email)) errors.push('Bitte geben Sie eine gültige E-Mail-Adresse an.');
  if (form.body.length < 10) errors.push('Bitte formulieren Sie Ihre Nachricht etwas ausführlicher.');

  if (errors.length) {
    return res.status(400).render('contact', {
      title: 'Kontakt', description: '', form, errors,
    });
  }

  db.prepare(
    `INSERT INTO messages (name, email, phone, parcel, subject, body)
     VALUES (@name, @email, @phone, @parcel, @subject, @body)`,
  ).run(form);

  req.session.flash = {
    type: 'success',
    text: 'Vielen Dank für Ihre Nachricht. Die Vereinsleitung meldet sich bei Ihnen.',
  };
  return res.redirect('/kontakt');
});

/* ---------- Impressum ---------- */

router.get('/impressum', (req, res) => {
  res.render('imprint', {
    title: 'Impressum',
    description: 'Impressum und Offenlegung des Kleingartenvereins An der Rehlacke.',
    board: q.board.all(),
  });
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nAllow: /\n`);
});

/* ---------- CMS-Seiten (flache URLs) ---------- */

router.get('/:slug', (req, res, next) => {
  const { slug } = req.params;
  if (RESERVED.has(slug)) return next();

  const page = q.pageBySlug.get(slug);
  if (!page) return next();

  const siblings = db.prepare(
    `SELECT slug, title, nav_title FROM pages
      WHERE published = 1 AND section = ? AND slug != ? ORDER BY position, title`,
  ).all(page.section, page.slug);

  return res.render('page', {
    title: page.title,
    description: plainText(page.intro || page.body, 155),
    page,
    html: renderMarkdown(page.body),
    siblings,
  });
});

module.exports = router;
