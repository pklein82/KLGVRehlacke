'use strict';

/**
 * Adressen, die feste Routen belegen. CMS-Seiten dürfen diese Kürzel nicht
 * verwenden, weil die feste Route sonst gewinnt und die Seite unerreichbar wäre.
 */
module.exports = new Set([
  'aktuelles', 'termine', 'vereinsleitung', 'downloads', 'flohmarkt',
  'kontakt', 'impressum', 'admin', 'uploads', 'css', 'js', 'img',
  'favicon.ico', 'robots.txt',
]);
