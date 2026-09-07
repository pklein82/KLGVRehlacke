'use strict';

/**
 * Die Bildmarke des Vereins in drei Ausbaustufen.
 *
 * Alle Fassungen sind Inline-SVG ohne Bilddatei und ohne Schriftlizenz. Die
 * Farben stehen als Klassen im Markup und werden in site.css über Tokens
 * gesetzt, damit helles und dunkles Design je eigene Werte bekommen.
 *
 *   scene()   – die vollständige Szene in Farbe, für die Startseite
 *   roundel() – Linienfassung im Kreis, einfarbig (currentColor):
 *               Seitenkopf, Fußbereich, Stempel
 *   favicon() – noch weiter reduziert, damit sie bei 16 px trägt
 *
 * Warum drei Stufen: Haus, Baum, Zaun und Teich sind bei 26 px im Seitenkopf
 * nicht mehr unterscheidbar. Statt die Szene zu verkleinern, bis sie zu einem
 * Fleck wird, übernimmt dort die Linienfassung.
 */

/** Vollständige Szene in Farbe. Erscheint ab etwa 120 px Breite sinnvoll. */
function scene({ title = 'Kleingartenanlage An der Rehlacke' } = {}) {
  return `<svg class="logo-scene" viewBox="0 0 168 108" role="img" aria-label="${title}">
  <ellipse class="lg-mound" cx="84" cy="93" rx="80" ry="13"/>
  <path class="lg-hill" d="M96 93q16-31 34-31t34 31Z"/>
  <path class="lg-hill" d="M4 93q14-23 30-23t30 23Z"/>
  <circle class="lg-sun" cx="141" cy="26" r="11"/>
  <circle class="lg-shrub" cx="10" cy="86" r="8"/>
  <circle class="lg-shrub" cx="20" cy="89" r="6"/>
  <path class="lg-built" d="M15 59 38 45l23 14Z"/>
  <path class="lg-built" d="M23 58h30v35H23Z"/>
  <path class="lg-door" d="M33 74h10v19H33Z"/>
  <path class="lg-built" d="M74 93V58h5v35Z"/>
  <circle class="lg-canopy" cx="60" cy="54" r="13"/>
  <circle class="lg-canopy" cx="92" cy="54" r="13"/>
  <circle class="lg-canopy" cx="76" cy="44" r="19"/>
  <circle class="lg-canopy-dark" cx="87" cy="45" r="9"/>
  <path class="lg-built" d="M100 66h4v27h-4ZM108 66h4v27h-4ZM116 66h4v27h-4ZM124 66h4v27h-4ZM132 66h4v27h-4Z"/>
  <path class="lg-built" d="M98 71h40v4H98ZM98 81h40v4H98Z"/>
  <path class="lg-built" d="M149 93h2.6V70H149Z"/>
  <path class="lg-canopy" d="M150.3 80c-4 0-6.8-2.7-6.8-6.8 4 0 6.8 2.7 6.8 6.8ZM150.3 74c4 0 6.8-2.7 6.8-6.8-4 0-6.8 2.7-6.8 6.8Z"/>
  <ellipse class="lg-water" cx="96" cy="97" rx="38" ry="7"/>
  <path class="lg-water-line" d="M78 95q10-2.4 20 0"/>
</svg>`;
}

/**
 * Linienfassung im Kreis, einfarbig über currentColor.
 * Setzt sich aus denselben Motiven zusammen: Sonne, Pflanze, Zaun, Wasser.
 */
function roundel({ size = 32, title = '' } = {}) {
  const label = title
    ? ` role="img" aria-label="${title}"`
    : ' aria-hidden="true" focusable="false"';

  return `<svg class="logo-roundel" viewBox="0 0 32 32" width="${size}" height="${size}"${label}>
  <g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="16" cy="16" r="14"/>
    <path d="M11.5 20V11"/>
    <path d="M11.5 15.4C9 15.4 7.2 13.7 7.2 11.2c2.5 0 4.3 1.7 4.3 4.2Z"/>
    <path d="M11.5 12.6c2.5 0 4.3-1.7 4.3-4.2-2.5 0-4.3 1.7-4.3 4.2Z"/>
    <path d="M17.2 19.6V15M19.8 19.6V15M22.4 19.6V15M25 19.6V15"/>
    <path d="M16.4 17h9.4"/>
    <path d="M6.8 22.8q9.2-2.5 18.4 0"/>
    <path d="M9.4 26.4q6.6-1.9 13.2 0"/>
  </g>
  <circle cx="23" cy="9" r="2.4" fill="currentColor"/>
</svg>`;
}

/**
 * Fassung für das Favicon: Zaun und Rahmenlinie entfallen, die Striche sind
 * kräftiger. Bei 16 px bleiben Kreis, Pflanze, Sonne und Wasser lesbar.
 */
function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#1d4d33"/>
  <g fill="none" stroke="#eaf6ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 22.5V11"/>
    <path d="M14 16.2c-3 0-5.2-2.1-5.2-5.2 3 0 5.2 2.1 5.2 5.2Z"/>
    <path d="M14 13c3 0 5.2-2.1 5.2-5.2-3 0-5.2 2.1-5.2 5.2Z"/>
    <path d="M6.4 25.4q9.6-2.8 19.2 0"/>
  </g>
  <circle cx="24" cy="9.5" r="3" fill="#f0c65a"/>
</svg>`;
}

module.exports = { scene, roundel, favicon };
