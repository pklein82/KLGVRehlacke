'use strict';

const { marked } = require('marked');

marked.setOptions({ gfm: true, breaks: true });

/**
 * Nur unbedenkliche Ziele in Links und Bildern zulassen. Ohne diese Prüfung
 * könnte `[Text](javascript:…)` aus dem Editor ausführbaren Code erzeugen.
 */
const SAFE_URL = /^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#|\.\/)/i;

function safeUrl(href) {
  const value = String(href || '').trim();
  return SAFE_URL.test(value) ? value : '';
}

marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      if (!url) return text;

      const external = /^https?:\/\//i.test(url);
      return `<a href="${url}"${title ? ` title="${title}"` : ''}`
        + `${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    },

    image({ href, title, text }) {
      const url = safeUrl(href);
      if (!url) return text || '';
      return `<img src="${url}" alt="${text || ''}"${title ? ` title="${title}"` : ''} loading="lazy">`;
    },
  },
});

const MONTHS = [
  'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const UMLAUTS = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', Ä: 'ae', Ö: 'oe', Ü: 'ue' };

function slugify(input) {
  return String(input || '')
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUTS[c])
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'seite';
}

/** Escapes the five characters that matter in HTML text and attributes. */
function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders editor markdown to HTML. Raw HTML in the source is escaped first,
 * so a compromised editor account cannot inject scripts into public pages.
 */
function renderMarkdown(source) {
  if (!source) return '';
  const html = marked.parse(escapeHtml(source));
  // Breite Tabellen bekommen einen scrollbaren Rahmen – auch ohne JavaScript.
  return html.replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

/** Plain-text excerpt, used for meta descriptions and card previews. */
function plainText(source, limit = 180) {
  const text = String(source || '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

function parseDate(value) {
  if (!value) return null;
  // Accepts "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM"
  const iso = String(value).trim().replace(' ', 'T');
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, { weekday = false } = {}) {
  const d = parseDate(value);
  if (!d) return '';
  const base = `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return weekday ? `${WEEKDAYS[d.getDay()]}, ${base}` : base;
}

function formatTime(value) {
  const d = parseDate(value);
  if (!d || String(value).length <= 10) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Compact day/month badge for event cards. */
function dateParts(value) {
  const d = parseDate(value);
  if (!d) return { day: '', month: '', weekday: '' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()].slice(0, 3),
    weekday: WEEKDAYS[d.getDay()].slice(0, 2),
  };
}

function formatEventRange(event) {
  const date = formatDate(event.starts_at, { weekday: true });
  if (event.all_day) return date;
  const from = formatTime(event.starts_at);
  const to = formatTime(event.ends_at);
  if (from && to) return `${date}, ${from} – ${to} Uhr`;
  if (from) return `${date}, ${from} Uhr`;
  return date;
}

/** Returns true for URLs that stay on this site — used to validate redirects. */
function safeRedirect(target, fallback = '/admin') {
  const value = String(target || '');
  return /^\/(?!\/)[\w\-./?=&%#]*$/.test(value) ? value : fallback;
}

module.exports = {
  slugify, escapeHtml, renderMarkdown, plainText,
  formatDate, formatTime, formatEventRange, dateParts, parseDate,
  safeRedirect, MONTHS, WEEKDAYS,
};
