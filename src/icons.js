'use strict';

/**
 * Inline-SVG-Icons im 24er-Raster. Der Strich folgt currentColor,
 * dadurch passen die Symbole automatisch zum Textkontext.
 */

const ICONS = {
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  news: '<path d="M15 18h-5M10 6h8v4h-8zM18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m2 7 8.97 5.7a2 2 0 0 0 2.06 0L22 7"/>',
  phone: '<path d="M13.8 10.2a11 11 0 0 0 4.5 3.4l1.5-1.5a1.5 1.5 0 0 1 1.6-.3 15 15 0 0 0 2.1.6 1.5 1.5 0 0 1 1.2 1.5v2.6a1.5 1.5 0 0 1-1.6 1.5A18.5 18.5 0 0 1 2.5 3.6 1.5 1.5 0 0 1 4 2h2.6a1.5 1.5 0 0 1 1.5 1.2q.2 1.1.6 2.1a1.5 1.5 0 0 1-.3 1.6L6.9 8.4"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  plant: '<path d="M12 22V10"/><path d="M12 10c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6ZM12 10c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z"/><path d="M7 22h10"/>',
  water: '<path d="M12 2.7 6.6 8.1a7.6 7.6 0 1 0 10.8 0Z"/>',
  euro: '<path d="M4 10h12M4 14h9"/><path d="M19 5a8 8 0 1 0 0 14"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  map: '<path d="M14.1 4.2a2 2 0 0 0-1.4 0L8.6 5.6a2 2 0 0 1-1.4 0L4.6 4.7A1 1 0 0 0 3.2 5.6v12.2a1 1 0 0 0 .7 1l3.3 1.1a2 2 0 0 0 1.4 0l4.1-1.4a2 2 0 0 1 1.4 0l2.6.9a1 1 0 0 0 1.4-1V6.2a1 1 0 0 0-.7-1Z"/><path d="M9 4.5v15M15 5.5v15"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1 1 0 0 1 1.3 0C14.3 3.8 16.8 5 18.8 5a1 1 0 0 1 1 1Z"/>',
};

/** Gibt ein fertiges <svg>-Element als HTML-String zurück. */
function icon(name, cls) {
  const body = ICONS[name] || ICONS.info;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
    + (cls ? ' class="' + cls + '"' : '') + '>' + body + '</svg>';
}

module.exports = { icon, ICONS };
