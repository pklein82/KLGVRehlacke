'use strict';

/**
 * Rauchtest: startet die Anwendung auf einem freien Port und prüft die
 * wichtigsten öffentlichen Seiten, die Anmeldung und die Schutzmechanismen.
 *
 * Ausführen mit:  npm test
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Eigene Datenbank pro Testlauf, damit echte Inhalte unberührt bleiben.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rehlacke-test-'));
process.env.DATA_DIR = path.join(tmp, 'data');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.SESSION_SECRET = 'test-only-secret';
process.env.ADMIN_EMAIL = 'test@rehlacke.at';
process.env.ADMIN_PASSWORD = 'test-kennwort-123';

const app = require('../server');
const { renderMarkdown, slugify, formatEventRange } = require('../src/helpers');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => {
  server?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

/** Holt eine Seite und gibt Status und Text zurück. */
async function get(pathname, options = {}) {
  const response = await fetch(base + pathname, { redirect: 'manual', ...options });
  return { status: response.status, body: await response.text(), headers: response.headers };
}

function tokenFrom(html) {
  return html.match(/name="_csrf" value="([^"]+)"/)?.[1];
}

test('öffentliche Seiten sind erreichbar', async () => {
  const paths = [
    '/', '/aktuelles', '/termine', '/verein', '/ruhezeiten', '/kosten',
    '/beschluesse-hv', '/gartenfachberatung', '/muellentleerung', '/lageplan',
    '/links', '/todesfaelle', '/vereinsleitung', '/downloads', '/flohmarkt',
    '/kontakt', '/impressum', '/datenschutz', '/robots.txt',
  ];

  for (const p of paths) {
    const { status } = await get(p);
    assert.equal(status, 200, `${p} sollte 200 liefern`);
  }
});

test('unbekannte Adresse liefert 404', async () => {
  const { status } = await get('/gibt-es-nicht');
  assert.equal(status, 404);
});

test('Beitrag aus den Startinhalten ist abrufbar', async () => {
  const { status, body } = await get('/aktuelles/achtung-einbrecher');
  assert.equal(status, 200);
  assert.match(body, /Sicherheitshinweise/);
});

test('übernommene Vereinsdaten erscheinen auf der Website', async () => {
  const leitung = await get('/vereinsleitung');
  assert.match(leitung.body, /Michael Stocker/);
  assert.match(leitung.body, /Obmann/);

  const kosten = await get('/kosten');
  assert.match(kosten.body, /1,76 €\/m²/, 'Pachtsatz aus der Kostentabelle');

  const ruhe = await get('/ruhezeiten');
  assert.match(ruhe.body, /15\. April/);

  const impressum = await get('/impressum');
  assert.match(impressum.body, /968 877 975/, 'ZVR-Zahl');
});

test('Redaktionsbereich verlangt eine Anmeldung', async () => {
  const { status, headers } = await get('/admin');
  assert.equal(status, 302);
  assert.match(headers.get('location'), /\/admin\/login/);
});

test('Anmeldung mit falschem Kennwort schlägt fehl', async () => {
  const page = await get('/admin/login');
  const cookie = page.headers.get('set-cookie').split(';')[0];

  const { status } = await get('/admin/login', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      _csrf: tokenFrom(page.body), email: 'test@rehlacke.at', password: 'falsch',
    }),
  });

  assert.equal(status, 401);
});

test('Anmeldung mit richtigem Kennwort führt in die Redaktion', async () => {
  const page = await get('/admin/login');
  const cookie = page.headers.get('set-cookie').split(';')[0];

  const login = await get('/admin/login', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      _csrf: tokenFrom(page.body),
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });

  assert.equal(login.status, 302);
  const session = login.headers.get('set-cookie').split(';')[0];

  const dashboard = await get('/admin', { headers: { cookie: session } });
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.body, /Übersicht/);
});

test('Formular ohne CSRF-Token wird abgewiesen', async () => {
  const { status } = await get('/kontakt', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ name: 'Test', email: 'a@b.at', body: 'Eine Nachricht.' }),
  });

  assert.equal(status, 403);
});

test('Anzeigen aus dem Formular erscheinen erst nach der Prüfung', async () => {
  const page = await get('/flohmarkt');
  const cookie = page.headers.get('set-cookie').split(';')[0];

  const submit = await get('/flohmarkt', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      _csrf: tokenFrom(page.body),
      kind: 'biete',
      title: 'Testanzeige Gartenschlauch',
      body: 'Zwanzig Meter, wenig benutzt.',
      contact: 'in der Sprechstunde',
    }),
  });

  assert.equal(submit.status, 302);

  const listings = await get('/flohmarkt');
  assert.ok(!listings.body.includes('Testanzeige Gartenschlauch'),
    'unbestätigte Anzeigen dürfen nicht öffentlich sein');
});

test('Sicherheitskopfzeilen sind gesetzt', async () => {
  const { headers } = await get('/');
  assert.match(headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-powered-by'), null);
});

test('Markdown lässt kein HTML und keine gefährlichen Adressen durch', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(2))\n\n**fett**');
  assert.ok(!html.includes('<script>'), 'HTML muss escaped werden');
  assert.ok(!html.includes('javascript:'), 'javascript:-Adressen müssen entfernt werden');
  assert.match(html, /<strong>fett<\/strong>/);
});

test('Kürzel behandeln Umlaute korrekt', () => {
  assert.equal(slugify('Grüße aus Wien – Übersicht!'), 'gruesse-aus-wien-uebersicht');
  assert.equal(slugify(''), 'seite');
});

test('Termine werden auf Deutsch formatiert', () => {
  assert.equal(
    formatEventRange({ starts_at: '2026-05-01T14:30', ends_at: '2026-05-01T18:00', all_day: 0 }),
    'Freitag, 1. Mai 2026, 14:30 – 18:00 Uhr',
  );
  assert.equal(
    formatEventRange({ starts_at: '2026-11-07', ends_at: '', all_day: 1 }),
    'Samstag, 7. November 2026',
  );
});
