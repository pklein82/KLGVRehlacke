'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');

const { db, getSettings } = require('./src/db');
const SqliteStore = require('./src/session-store');
const { seed } = require('./src/seed');
const helpers = require('./src/helpers');
const { icon } = require('./src/icons');
const logo = require('./src/logo');
const buildNavigation = require('./src/navigation');
const { ensureToken, verify } = require('./src/csrf');

seed();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PRODUCTION = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: false, limit: '256kb' }));

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  sessionSecret = crypto.randomBytes(32).toString('hex');
  if (PRODUCTION) {
    console.warn('[warn] SESSION_SECRET ist nicht gesetzt – Anmeldungen gehen bei jedem Neustart verloren.');
  }
}

app.use(session({
  name: 'rehlacke.sid',
  store: new SqliteStore(db),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: PRODUCTION,
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

/* Security headers. The CSP allows only own resources – no external scripts or fonts. */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; "
    + "frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none'",
  );
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  index: false,
  dotfiles: 'deny',
}));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: PRODUCTION ? '7d' : 0 }));

/* Per-request view context: settings, navigation, helpers, CSRF token, flash messages. */
app.use((req, res, next) => {
  const settings = getSettings();
  res.locals.settings = settings;

  /*
   * Was an den gut sichtbaren Stellen gezeigt werden darf. Ohne eine
   * unpersönliche Vereinsadresse bleibt dort nur der Verweis auf das
   * Kontaktformular – keine private Nummer, keine private E-Mail-Adresse.
   */
  res.locals.publicContact = {
    email: settings.public_email,
    phone: settings.public_phone,
    hasAny: Boolean(settings.public_email || settings.public_phone),
  };
  res.locals.nav = buildNavigation();
  res.locals.h = helpers;
  res.locals.icon = icon;
  res.locals.logo = logo;
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session.user || null;
  res.locals.year = new Date().getFullYear();
  res.locals.flash = req.session.flash || null;
  res.locals.title = '';
  res.locals.description = '';
  res.locals.bodyClass = '';
  delete req.session.flash;
  next();
});

app.use(ensureToken);

/*
 * Der Adminbereich verarbeitet Formulare mit Datei-Upload und prüft das
 * CSRF-Token daher selbst – direkt nach Multer. Alle übrigen Routen nehmen
 * nur urlencodierte Formulare an und werden hier zentral geprüft.
 */
app.use('/admin', require('./src/routes/admin'));
app.use(verify);
app.use('/', require('./src/routes/public'));

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Seite nicht gefunden',
    heading: '404 – Seite nicht gefunden',
    message: 'Diese Seite existiert nicht oder wurde verschoben.',
  });
});

/* Upload-Fehler bekommen eine verständliche Meldung statt eines nackten 500ers. */
const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: [413, 'Datei zu groß', 'Bitte laden Sie eine kleinere Datei hoch (maximal 8 MB).'],
  LIMIT_FILE_TYPE: [415, 'Dateityp nicht erlaubt',
    'Erlaubt sind Bilder (JPG, PNG, WebP, GIF, SVG), PDF, Word, Excel und Textdateien.'],
  LIMIT_FILE_COUNT: [413, 'Zu viele Dateien', 'Bitte laden Sie höchstens 8 Dateien gleichzeitig hoch.'],
  LIMIT_UNEXPECTED_FILE: [400, 'Unerwartete Datei', 'Bitte verwenden Sie das Formular auf der Seite erneut.'],
};

app.use((err, req, res, _next) => {
  const known = UPLOAD_ERRORS[err.code];
  if (!known) console.error(err);

  const [status, heading, message] = known || [
    500,
    'Es ist ein Fehler aufgetreten',
    'Bitte versuchen Sie es später erneut. Wenn der Fehler bestehen bleibt, kontaktieren Sie die Vereinsleitung.',
  ];

  res.status(status).render('error', { title: heading, heading, message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`KGV Rehlacke läuft auf http://localhost:${PORT}`);
    console.log(`Redaktionsbereich: http://localhost:${PORT}/admin`);
  });
}

module.exports = app;
