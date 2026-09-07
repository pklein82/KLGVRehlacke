'use strict';

const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.ms-excel', '.xls'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
  ['text/plain', '.txt'],
]);

/**
 * Multer liefert `originalname` als Latin-1-Bytes. Ohne diese Umwandlung wird
 * aus „gärten.png“ ein „gÃ¤rten.png“.
 */
function decodeName(original) {
  return Buffer.from(String(original || ''), 'latin1').toString('utf8');
}

/** Dateiname aus dem Original: lesbar, aber ohne Pfad- oder Sonderzeichen. */
function safeName(original, mime) {
  const ext = ALLOWED.get(mime) || path.extname(original).toLowerCase().slice(0, 8) || '.bin';
  const base = path.basename(original, path.extname(original))
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'datei';
  return `${base}-${crypto.randomBytes(4).toString('hex')}${ext}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      file.originalname = decodeName(file.originalname);
      cb(null, safeName(file.originalname, file.mimetype));
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    const error = new Error(`Dateityp nicht erlaubt: ${file.mimetype}`);
    error.code = 'LIMIT_FILE_TYPE';
    return cb(error);
  },
});

module.exports = { upload, UPLOAD_DIR, ALLOWED, decodeName };
