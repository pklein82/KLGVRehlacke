'use strict';

/**
 * Exportiert die öffentlichen Seiten als statische Dateien.
 *
 *   npm run export                     -> Basispfad /KLGVRehlacke/ (GitHub Pages)
 *   BASE_PATH=/ npm run export         -> eigene Domain
 *   OUT_DIR=build npm run export       -> anderer Zielordner
 *
 * Der Export zeigt den Stand der Datenbank zum Zeitpunkt des Bauens. In der
 * Fertigungsstrecke gibt es keine gepflegte Datenbank, dort entstehen also die
 * Startinhalte aus src/seed.js. Redaktionsbereich und Formulare brauchen den
 * Server und sind im Export abgeschaltet.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, process.env.OUT_DIR || 'dist');

// Muss auf "/" endteilen, damit die Ersetzung unten sauber greift.
const BASE = (process.env.BASE_PATH || '/KLGVRehlacke/').replace(/\/*$/, '/');

/*
 * Ein öffentlich erreichbarer Abzug der Vereinsseite soll der echten Seite in
 * Suchmaschinen keine Konkurrenz machen. Der Export ist daher standardmäßig
 * auf noindex gestellt. Wer den Export selbst als Website betreibt, setzt
 * INDEXABLE=1.
 */
const INDEXABLE = process.env.INDEXABLE === '1';

const app = require('../server');
const { db } = require('../src/db');

/* ---------- Welche Adressen exportiert werden ---------- */

function collectRoutes() {
  const fixed = [
    '/', '/aktuelles', '/termine', '/vereinsleitung',
    '/downloads', '/flohmarkt', '/kontakt', '/impressum',
  ];

  const pages = db.prepare('SELECT slug FROM pages WHERE published = 1 ORDER BY slug')
    .all().map((r) => `/${r.slug}`);

  const news = db.prepare('SELECT slug FROM news WHERE published = 1 ORDER BY slug')
    .all().map((r) => `/aktuelles/${r.slug}`);

  return [...fixed, ...pages, ...news];
}

/* ---------- Adressen im HTML auf den Basispfad umschreiben ---------- */

/**
 * Ersetzt wurzelrelative Adressen durch den Basispfad. Protokoll-relative
 * Adressen (//host) und alles mit Schema bleiben unberührt.
 */
function rewrite(html) {
  let out = html.replace(
    /\b(href|src|action)="\/(?!\/)([^"]*)"/g,
    (_, attr, rest) => `${attr}="${BASE}${rest}"`,
  );

  if (!INDEXABLE) {
    out = out.replace(
      '<meta charset="utf-8">',
      '<meta charset="utf-8">\n  <meta name="robots" content="noindex, nofollow">',
    );
  }

  // Das Skript, das Formulare im Export abschaltet, gehört auf jede Seite.
  out = out.replace(
    '</body>',
    `<script src="${BASE}js/static.js" defer></script>\n</body>`,
  );

  return out;
}

/* ---------- Dateien schreiben ---------- */

async function writePage(route, html) {
  const rel = route === '/' ? 'index.html' : path.join(route.slice(1), 'index.html');
  const target = path.join(OUT, rel);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, rewrite(html), 'utf8');
  return rel;
}

async function copyTree(from, to) {
  if (!fs.existsSync(from)) return 0;
  await fsp.mkdir(path.dirname(to), { recursive: true });
  await fsp.cp(from, to, { recursive: true });
  let n = 0;
  for (const entry of await fsp.readdir(to, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) n += 1;
  }
  return n;
}

/* ---------- Ablauf ---------- */

async function main() {
  await fsp.rm(OUT, { recursive: true, force: true });
  await fsp.mkdir(OUT, { recursive: true });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const origin = `http://127.0.0.1:${server.address().port}`;

  const routes = collectRoutes();
  let written = 0;

  for (const route of routes) {
    const response = await fetch(origin + route);
    if (!response.ok) {
      throw new Error(`${route} lieferte ${response.status} – Export abgebrochen`);
    }
    const rel = await writePage(route, await response.text());
    written += 1;
    console.log(`  ${route.padEnd(44)} -> ${rel}`);
  }

  // Fehlerseite: GitHub Pages liefert 404.html bei unbekannten Adressen aus.
  const notFound = await fetch(`${origin}/gibt-es-nicht`);
  await fsp.writeFile(path.join(OUT, '404.html'), rewrite(await notFound.text()), 'utf8');

  if (INDEXABLE) {
    const robots = await fetch(`${origin}/robots.txt`);
    await fsp.writeFile(path.join(OUT, 'robots.txt'), await robots.text(), 'utf8');
  } else {
    await fsp.writeFile(
      path.join(OUT, 'robots.txt'),
      'User-agent: *\nDisallow: /\n',
      'utf8',
    );
  }

  server.close();

  const assets = await copyTree(path.join(ROOT, 'public'), OUT);
  const uploads = await copyTree(path.join(ROOT, 'uploads'), path.join(OUT, 'uploads'));

  // Ohne diese Datei ignoriert GitHub Pages Ordner, die mit _ beginnen.
  await fsp.writeFile(path.join(OUT, '.nojekyll'), '', 'utf8');

  console.log(`\n${written} Seiten, ${assets} Dateien aus public/, ${uploads} Uploads`);
  console.log(`Basispfad: ${BASE}`);
  console.log(`Suchmaschinen: ${INDEXABLE ? 'erlaubt' : 'ausgeschlossen (INDEXABLE=1 erlaubt sie)'}`);
  console.log(`Zielordner: ${path.relative(ROOT, OUT)}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
