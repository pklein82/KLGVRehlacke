'use strict';

const crypto = require('node:crypto');

/**
 * CSRF-Schutz nach dem Synchronizer-Token-Muster.
 *
 * `verify` liest das Token aus `req.body`. Es muss deshalb immer NACH dem
 * Body-Parser laufen – bei Formularen mit Datei-Upload also nach Multer.
 */

function ensureToken(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrf;
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function verify(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const sent = req.body?._csrf;
  const expected = req.session?.csrf;
  const ok = typeof sent === 'string' && typeof expected === 'string'
    && sent.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));

  if (ok) return next();

  res.status(403);
  return res.render('error', {
    title: 'Sitzung abgelaufen',
    heading: 'Sitzung abgelaufen',
    message: 'Bitte laden Sie die Seite neu und senden Sie das Formular erneut ab.',
  });
}

module.exports = { ensureToken, verify };
