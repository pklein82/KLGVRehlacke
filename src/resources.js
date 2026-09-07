'use strict';

/**
 * Beschreibung aller im CMS verwaltbaren Inhaltstypen.
 * Aus diesen Definitionen entstehen Listen, Formulare und die SQL-Abfragen –
 * ein neuer Inhaltstyp braucht daher nur einen Eintrag hier und eine Tabelle.
 *
 * Feldtypen: text | textarea | markdown | number | checkbox | select | date
 *            | datetime | image | file
 */

const RESOURCES = {
  news: {
    label: 'Beiträge',
    singular: 'Beitrag',
    icon: 'news',
    table: 'news',
    order: "pinned DESC, COALESCE(NULLIF(published_at, ''), updated_at) DESC, id DESC",
    slugFrom: 'title',
    touch: 'updated_at',
    publicPath: (row) => `/aktuelles/${row.slug}`,
    columns: [
      { key: 'title', label: 'Titel', primary: true },
      { key: 'published_at', label: 'Datum', type: 'date' },
      { key: 'pinned', label: 'Wichtig', type: 'flag' },
      { key: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { key: 'title', label: 'Titel', type: 'text', required: true, maxlength: 160 },
      {
        key: 'published_at',
        label: 'Veröffentlicht am',
        type: 'date',
        width: 'half',
        hint: 'Optional. Ohne Datum erscheint der Beitrag ohne Datumsangabe.',
      },
      { key: 'slug', label: 'URL-Kürzel', type: 'text', width: 'half', hint: 'Leer lassen: wird aus dem Titel erzeugt.' },
      { key: 'excerpt', label: 'Kurzfassung', type: 'textarea', maxlength: 400, hint: 'Erscheint in der Übersicht und in Suchmaschinen.' },
      { key: 'body', label: 'Text', type: 'markdown', rows: 18 },
      { key: 'image', label: 'Beitragsbild', type: 'image' },
      { key: 'pinned', label: 'Als wichtig oben anzeigen', type: 'checkbox', width: 'half' },
      { key: 'published', label: 'Veröffentlicht', type: 'checkbox', default: 1, width: 'half' },
    ],
  },

  termine: {
    label: 'Termine',
    singular: 'Termin',
    icon: 'calendar',
    table: 'events',
    order: 'starts_at DESC',
    publicPath: () => '/termine',
    columns: [
      { key: 'title', label: 'Titel', primary: true },
      { key: 'starts_at', label: 'Beginn', type: 'datetime' },
      { key: 'location', label: 'Ort' },
      { key: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { key: 'title', label: 'Titel', type: 'text', required: true, maxlength: 160 },
      { key: 'starts_at', label: 'Beginn', type: 'datetime', required: true, width: 'half' },
      { key: 'ends_at', label: 'Ende', type: 'datetime', width: 'half' },
      { key: 'all_day', label: 'Ganztägig (Uhrzeit nicht anzeigen)', type: 'checkbox' },
      { key: 'location', label: 'Ort', type: 'text', maxlength: 160, width: 'half' },
      { key: 'description', label: 'Beschreibung', type: 'textarea', rows: 5 },
      { key: 'published', label: 'Veröffentlicht', type: 'checkbox', default: 1 },
    ],
  },

  seiten: {
    label: 'Seiten',
    singular: 'Seite',
    icon: 'book',
    table: 'pages',
    order: 'section, position, title',
    slugFrom: 'title',
    touch: 'updated_at',
    publicPath: (row) => `/${row.slug}`,
    columns: [
      { key: 'title', label: 'Titel', primary: true },
      { key: 'slug', label: 'URL' },
      { key: 'section', label: 'Bereich' },
      { key: 'position', label: 'Reihenfolge' },
      { key: 'published', label: 'Status', type: 'status' },
    ],
    fields: [
      { key: 'title', label: 'Titel', type: 'text', required: true, maxlength: 160 },
      { key: 'slug', label: 'URL-Kürzel', type: 'text', width: 'half', hint: 'Die Seite ist danach unter /kürzel erreichbar.' },
      { key: 'nav_title', label: 'Bezeichnung im Menü', type: 'text', width: 'half', hint: 'Leer lassen: der Titel wird verwendet.' },
      { key: 'intro', label: 'Einleitung', type: 'textarea', maxlength: 400, hint: 'Kurzer Text unter der Überschrift.' },
      { key: 'body', label: 'Inhalt', type: 'markdown', rows: 22 },
      {
        key: 'section',
        label: 'Bereich',
        type: 'select',
        width: 'half',
        default: 'verein',
        options: [
          { value: 'verein', label: 'Verein' },
          { value: 'service', label: 'Service' },
          { value: 'rechtliches', label: 'Rechtliches' },
        ],
      },
      { key: 'position', label: 'Reihenfolge', type: 'number', width: 'half', default: 100, hint: 'Kleinere Zahl = weiter vorne.' },
      { key: 'in_nav', label: 'Im Hauptmenü anzeigen', type: 'checkbox', default: 1, width: 'half' },
      { key: 'published', label: 'Veröffentlicht', type: 'checkbox', default: 1, width: 'half' },
    ],
  },

  vereinsleitung: {
    label: 'Vereinsleitung',
    singular: 'Funktion',
    icon: 'users',
    table: 'board',
    order: 'position, name',
    publicPath: () => '/vereinsleitung',
    columns: [
      { key: 'role', label: 'Funktion', primary: true },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'E-Mail' },
      { key: 'position', label: 'Reihenfolge' },
    ],
    fields: [
      { key: 'role', label: 'Funktion', type: 'text', required: true, maxlength: 120, width: 'half' },
      { key: 'name', label: 'Name', type: 'text', required: true, maxlength: 120, width: 'half' },
      { key: 'email', label: 'E-Mail', type: 'text', maxlength: 160, width: 'half' },
      { key: 'phone', label: 'Telefon', type: 'text', maxlength: 60, width: 'half' },
      { key: 'note', label: 'Hinweis', type: 'textarea', rows: 3, maxlength: 300 },
      { key: 'photo', label: 'Foto', type: 'image' },
      { key: 'position', label: 'Reihenfolge', type: 'number', default: 100, width: 'half' },
    ],
  },

  dokumente: {
    label: 'Dokumente',
    singular: 'Dokument',
    icon: 'file',
    table: 'documents',
    order: 'category, position, title',
    publicPath: () => '/downloads',
    columns: [
      { key: 'title', label: 'Titel', primary: true },
      { key: 'category', label: 'Kategorie' },
      { key: 'file', label: 'Datei', type: 'filelink' },
      { key: 'position', label: 'Reihenfolge' },
    ],
    fields: [
      { key: 'title', label: 'Titel', type: 'text', required: true, maxlength: 160 },
      { key: 'description', label: 'Beschreibung', type: 'textarea', rows: 3, maxlength: 400 },
      { key: 'file', label: 'Datei (PDF, Bild, Office)', type: 'file' },
      { key: 'link', label: 'Alternativ: externer Link', type: 'text', maxlength: 400, hint: 'Wird verwendet, wenn keine Datei hochgeladen ist.' },
      { key: 'category', label: 'Kategorie', type: 'text', maxlength: 80, default: 'Allgemein', width: 'half', hint: 'Dokumente mit gleicher Kategorie werden gruppiert.' },
      { key: 'position', label: 'Reihenfolge', type: 'number', default: 100, width: 'half' },
    ],
  },

  flohmarkt: {
    label: 'Anzeigen',
    singular: 'Anzeige',
    icon: 'tag',
    table: 'listings',
    order: "CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC",
    publicPath: () => '/flohmarkt',
    columns: [
      { key: 'title', label: 'Titel', primary: true },
      { key: 'kind', label: 'Art' },
      { key: 'parcel', label: 'Parzelle' },
      { key: 'created_at', label: 'Eingegangen', type: 'date' },
      { key: 'status', label: 'Status', type: 'moderation' },
    ],
    fields: [
      { key: 'title', label: 'Titel', type: 'text', required: true, maxlength: 160 },
      {
        key: 'kind',
        label: 'Art',
        type: 'select',
        width: 'half',
        default: 'biete',
        options: [{ value: 'biete', label: 'Ich biete' }, { value: 'suche', label: 'Ich suche' }],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        width: 'half',
        default: 'pending',
        options: [
          { value: 'pending', label: 'Wartet auf Prüfung' },
          { value: 'published', label: 'Veröffentlicht' },
          { value: 'rejected', label: 'Abgelehnt' },
        ],
      },
      { key: 'body', label: 'Beschreibung', type: 'textarea', rows: 6, maxlength: 2000 },
      { key: 'contact', label: 'Kontaktangabe', type: 'text', maxlength: 160, width: 'half' },
      { key: 'parcel', label: 'Parzelle', type: 'text', maxlength: 40, width: 'half' },
    ],
  },
};

module.exports = RESOURCES;
