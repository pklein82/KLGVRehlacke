'use strict';

const { db } = require('./db');

/**
 * Baut die Hauptnavigation. Die Einträge aus dem CMS werden in die Gruppen
 * „Verein“ und „Service“ einsortiert, damit die Leiste auch bei vielen
 * Seiten schmal bleibt.
 */
function buildNavigation() {
  const pages = db.prepare(
    `SELECT slug, title, nav_title, section FROM pages
      WHERE published = 1 AND in_nav = 1
      ORDER BY position, title`,
  ).all();

  const fromSection = (section) => pages
    .filter((p) => p.section === section)
    .map((p) => ({ href: `/${p.slug}`, label: p.nav_title || p.title }));

  const verein = [
    ...fromSection('verein'),
    { href: '/vereinsleitung', label: 'Vereinsleitung' },
  ];

  const service = [
    ...fromSection('service'),
    { href: '/downloads', label: 'Downloads' },
    { href: '/flohmarkt', label: 'Ich biete / Ich suche' },
  ];

  return [
    { href: '/', label: 'Start' },
    { href: '/aktuelles', label: 'Aktuelles' },
    { href: '/termine', label: 'Termine' },
    { label: 'Verein', children: verein },
    { label: 'Service', children: service },
    { href: '/kontakt', label: 'Kontakt' },
  ];
}

module.exports = buildNavigation;
