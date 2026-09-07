'use strict';

/**
 * Legt Standardinhalte an. Läuft beim Serverstart und ist idempotent:
 * bestehende Datensätze werden nie überschrieben.
 */

const bcrypt = require('bcryptjs');
const { db, setSettings, SETTING_DEFAULTS } = require('./db');

const PAGES = [
  {
    slug: 'verein',
    title: 'Der Verein',
    nav_title: 'Verein',
    section: 'verein',
    position: 10,
    intro: 'Wer wir sind, wie der Verein organisiert ist und wo Sie Unterstützung finden.',
    body: `## Über uns

Der **Kleingartenverein An der Rehlacke** liegt in der Wiener Donaustadt und bietet seinen Mitgliedern Parzellen zur Erholung, zum Gärtnern und für ein gutes nachbarschaftliches Miteinander.

Der Verein ist Mitglied im *Zentralverband der Kleingärtner und Siedler Österreichs* und verwaltet die Anlage im Auftrag der Stadt Wien.

## Organisation

Die Vereinsleitung wird von der Hauptversammlung gewählt und führt die laufenden Geschäfte. Grundlage dafür sind die Statuten, die Gartenordnung und die Beschlüsse der Hauptversammlung.

- **Hauptversammlung** – oberstes Organ, beschließt Beiträge und Grundsätze
- **Vereinsleitung** – Obmann/Obfrau, Kassier, Schriftführung und weitere Funktionen
- **Gartenfachberatung** – kostenlose Beratung für alle Mitglieder

## Anliegen und Fragen

Für Anliegen steht die Vereinsleitung in der Sprechstunde im Vereinshaus zur Verfügung. Schriftliche Anfragen richten Sie bitte an die im Kontakt angegebene Adresse.`,
  },
  {
    slug: 'ruhezeiten',
    title: 'Ruhezeiten',
    nav_title: 'Ruhezeiten',
    section: 'verein',
    position: 20,
    intro: 'Damit sich alle erholen können, gelten in der Anlage verbindliche Ruhezeiten.',
    body: `## Allgemeine Ruhezeiten

Zur Vermeidung unnötigen Lärms sind folgende Zeiten einzuhalten:

- **Täglich von 22:00 – 06:00 Uhr**
- **Montag bis Samstag von 12:00 – 15:00 Uhr**
- **Sonn- und Feiertags ab 12:00 Uhr**

## Mittagsruhe im Sommer

Zwischen **15. April und 15. September** gilt zusätzlich die Mittagsruhe. An Sonn- und Feiertagen sind lärmerregende Arbeiten in diesem Zeitraum nur von **09:00 – 12:00 Uhr** erlaubt.

## Bauarbeiten

In den Monaten **Juli und August** dürfen weder Abbruch- und Aushubarbeiten noch bewilligungspflichtige Bauarbeiten (MA 37) durchgeführt werden.

> Lärmerregende Geräte wie Rasenmäher, Motorsägen oder Häcksler sind außerhalb der Ruhezeiten zu verwenden. Bitte nehmen Sie Rücksicht auf Ihre Nachbarschaft.`,
  },
  {
    slug: 'kosten',
    title: 'Kosten',
    nav_title: 'Kosten',
    section: 'verein',
    position: 30,
    intro: 'Womit Mitglieder rechnen: Pacht, Beiträge und laufende Abgaben im Überblick.',
    body: `## Laufende Kosten

Die Kosten eines Kleingartens setzen sich aus mehreren Bestandteilen zusammen. Die genauen Beträge werden jährlich von der Hauptversammlung bzw. dem Zentralverband festgelegt.

| Position | Wofür | Abrechnung |
| --- | --- | --- |
| Pachtzins | Nutzung der Parzelle | jährlich |
| Mitgliedsbeitrag | Verein und Zentralverband | jährlich |
| Verwaltungskosten | Betrieb der Anlage | jährlich |
| Wasser | Verbrauch nach Zähler | jährlich |
| Strom | Verbrauch nach Zähler | jährlich |
| Versicherung | Rechtsschutz und Haftpflicht | jährlich |

## Zahlung

Die Vorschreibung erfolgt schriftlich. Bitte geben Sie bei der Überweisung immer **Parzellennummer und Name** als Zahlungsreferenz an.

*Die aktuellen Beträge entnehmen Sie der jährlichen Vorschreibung oder erfragen Sie in der Sprechstunde.*`,
  },
  {
    slug: 'gartenfachberatung',
    title: 'Gartenfachberatung',
    nav_title: 'Gartenfachberatung',
    section: 'verein',
    position: 40,
    intro: 'Kostenlose fachliche Beratung rund um Boden, Pflanzen und Pflanzenschutz.',
    body: `## Beratung für Mitglieder

Die Gartenfachberatung unterstützt alle Mitglieder kostenlos bei Fragen zu:

- Boden, Düngung und Kompostierung
- Obstbaumschnitt und Pflege
- Pflanzenschutz ohne Chemie
- Auswahl geeigneter Sorten
- Bewässerung und Trockenheit

## Termin vereinbaren

Am einfachsten sprechen Sie die Fachberatung in der Sprechstunde an oder hinterlassen eine Nachricht über das Kontaktformular.`,
  },
  {
    slug: 'lageplan',
    title: 'Lageplan',
    nav_title: 'Lageplan',
    section: 'service',
    position: 20,
    intro: 'Orientierung in der Anlage: Tore, Wege und Parzellen.',
    body: `## Anlage und Zufahrt

Die Anlage ist über die **Benatzkygasse** erreichbar. Bitte halten Sie die Tore geschlossen und die Zufahrtswege für Rettung und Feuerwehr frei.

## Anreise

- **Öffentlich:** U1 bis Kaisermühlen bzw. Alte Donau, weiter mit dem Bus
- **Fahrrad:** über den Donauradweg
- **Auto:** Parken ausschließlich auf den gekennzeichneten Flächen

*Der detaillierte Parzellenplan liegt im Vereinshaus auf und kann im Downloadbereich als PDF hinterlegt werden.*`,
  },
  {
    slug: 'links',
    title: 'Links',
    nav_title: 'Links',
    section: 'service',
    position: 40,
    in_nav: 0,
    intro: 'Weiterführende Seiten für Kleingärtnerinnen und Kleingärtner.',
    body: `## Verbände

- [Zentralverband der Kleingärtner und Siedler Österreichs](https://www.kleingaertner.at)
- [Landesverband Wien](https://www.kleingaertner.at)

## Stadt Wien

- [MA 37 – Baupolizei](https://www.wien.gv.at/wohnen/baupolizei/)
- [Wien Umweltschutz](https://www.wien.gv.at/umwelt/)`,
  },
  {
    slug: 'datenschutz',
    title: 'Datenschutz',
    nav_title: 'Datenschutz',
    section: 'rechtliches',
    position: 20,
    in_nav: 0,
    intro: 'Informationen zur Verarbeitung personenbezogener Daten auf dieser Website.',
    body: `## Verantwortlicher

Verantwortlich für die Datenverarbeitung ist der Kleingartenverein An der Rehlacke. Die Kontaktdaten finden Sie im Impressum.

## Welche Daten verarbeitet werden

- **Kontaktformular:** Name, E-Mail-Adresse und Ihre Nachricht, um die Anfrage zu bearbeiten.
- **Anzeigen im Bereich „Ich biete / Ich suche“:** die von Ihnen angegebenen Kontaktdaten,
  um die Anzeige zu veröffentlichen.
- **Server-Logfiles:** technisch notwendige Daten zum Betrieb der Website.

## Cookies

Diese Website setzt ausschließlich ein technisch notwendiges Cookie für die Anmeldung im Redaktionsbereich. Es findet **kein Tracking** und keine Analyse durch Dritte statt.

## Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Widerspruch. Wenden Sie sich dazu an die im Impressum genannte Adresse.`,
  },
];

const NEWS = [
  {
    slug: 'neue-website-ist-online',
    title: 'Unsere neue Website ist online',
    excerpt: 'Übersichtlicher, schneller und auch am Handy gut lesbar – die Vereinsseite in neuem Gewand.',
    body: `Wir haben unsere Website vollständig überarbeitet. Neu sind unter anderem:

- ein **Terminkalender** mit allen Vereinsveranstaltungen,
- ein **Downloadbereich** für Statuten, Gartenordnung und Beschlüsse,
- der Bereich **„Ich biete / Ich suche“** für Mitglieder,
- ein Layout, das auf **Handy, Tablet und Computer** gleich gut funktioniert.

Die Inhalte werden ab jetzt direkt von der Vereinsleitung gepflegt. Wenn Ihnen etwas fehlt oder Sie einen Fehler entdecken, melden Sie sich gerne über das Kontaktformular.`,
    published_at: '2026-09-01',
    pinned: 1,
  },
  {
    slug: 'wasser-aufdrehen-saisonstart',
    title: 'Saisonstart: Wasser wird aufgedreht',
    excerpt: 'Ab Anfang April steht die Wasserleitung in der Anlage wieder zur Verfügung.',
    body: `Mit dem Saisonstart wird die Wasserleitung in der gesamten Anlage wieder in Betrieb genommen.

Bitte prüfen Sie **vorher** Ihre Hausanschlüsse und Absperrventile auf Dichtheit. Undichte Leitungen führen zu hohen Verbrauchskosten, die auf die Parzelle umgelegt werden.

Der genaue Termin wird an den Anschlagtafeln bekannt gegeben.`,
    published_at: '2026-03-20',
  },
  {
    slug: 'ruhezeiten-erinnerung-sommer',
    title: 'Erinnerung: Mittagsruhe ab 15. April',
    excerpt: 'Von 15. April bis 15. September gilt in der Anlage zusätzlich die Mittagsruhe.',
    body: `Wir bitten alle Mitglieder, die Ruhezeiten einzuhalten – besonders die **Mittagsruhe von 12:00 bis 15:00 Uhr** zwischen 15. April und 15. September.

Lärmerregende Arbeiten sind an Sonn- und Feiertagen nur von 09:00 bis 12:00 Uhr erlaubt. Alle Details finden Sie auf der Seite [Ruhezeiten](/ruhezeiten).`,
    published_at: '2026-04-10',
  },
  {
    slug: 'gruenschnitt-sammlung',
    title: 'Grünschnitt-Sammlung im Herbst',
    excerpt: 'Termine und Regeln für die Abgabe von Baum- und Strauchschnitt.',
    body: `Im Herbst wird wieder Grünschnitt gesammelt. Bitte beachten Sie:

- nur **Baum- und Strauchschnitt**, keine Wurzelstöcke und keine Erde,
- Äste auf maximal **1,5 Meter** Länge kürzen,
- Ablage erst **am Vortag** an der gekennzeichneten Sammelstelle.

Restmüll, Kunststoff oder Bauschutt gehören nicht zum Grünschnitt und verursachen zusätzliche Entsorgungskosten für alle.`,
    published_at: '2026-08-15',
  },
];

const EVENTS = [
  {
    title: 'Sprechstunde der Vereinsleitung',
    starts_at: '2026-10-03T10:00',
    ends_at: '2026-10-03T12:00',
    location: 'Vereinshaus',
    description: 'Anliegen, Formulare und Fragen – ohne Voranmeldung.',
  },
  {
    title: 'Herbst-Arbeitseinsatz',
    starts_at: '2026-10-18T09:00',
    ends_at: '2026-10-18T13:00',
    location: 'Gemeinschaftsflächen',
    description: 'Wege, Hecken und Gemeinschaftsflächen winterfest machen. Werkzeug bitte mitbringen.',
  },
  {
    title: 'Wasserabsperrung – Ende der Saison',
    starts_at: '2026-11-07',
    all_day: 1,
    location: 'gesamte Anlage',
    description: 'Bitte alle Leitungen entleeren und Ventile offen lassen, um Frostschäden zu vermeiden.',
  },
  {
    title: 'Adventfeier',
    starts_at: '2026-12-06T16:00',
    ends_at: '2026-12-06T20:00',
    location: 'Vereinshaus',
    description: 'Punsch, Kekse und gute Gespräche. Alle Mitglieder mit Familie sind herzlich eingeladen.',
  },
  {
    title: 'Hauptversammlung',
    starts_at: '2027-03-13T15:00',
    ends_at: '2027-03-13T18:00',
    location: 'Vereinshaus',
    description: 'Berichte, Abstimmungen und Beschlüsse. Die Einladung mit Tagesordnung ergeht schriftlich.',
  },
];

const BOARD = [
  { name: 'Michael Stocker', role: 'Obmann', email: 'michael.stocker@aon.at', phone: '0699 116 70 583', position: 10, note: 'Erreichbar in der Sprechstunde und per E-Mail.' },
  { name: 'N. N.', role: 'Obmann-Stellvertretung', position: 20, note: 'Funktion in der Vereinsleitung.' },
  { name: 'N. N.', role: 'Kassier', position: 30, note: 'Vorschreibungen, Beiträge und Abrechnungen.' },
  { name: 'N. N.', role: 'Schriftführung', position: 40, note: 'Protokolle und Vereinskorrespondenz.' },
  { name: 'N. N.', role: 'Gartenfachberatung', position: 50, note: 'Beratung zu Boden, Pflanzen und Pflanzenschutz.' },
];

const DOCUMENTS = [
  { title: 'Statuten des Vereins', description: 'Rechtliche Grundlage des Kleingartenvereins.', category: 'Statuten & Ordnung', position: 10 },
  { title: 'Gartenordnung', description: 'Regeln für die Nutzung der Parzellen und Gemeinschaftsflächen.', category: 'Statuten & Ordnung', position: 20 },
  { title: 'Beschlüsse der Hauptversammlung', description: 'Aktuelle Beschlüsse im Überblick.', category: 'Hauptversammlung', position: 30 },
  { title: 'Bauordnung für Kleingärten', description: 'Was beim Bauen auf der Parzelle zu beachten ist.', category: 'Bauen', position: 40 },
  { title: 'Zentralverband der Kleingärtner', description: 'Informationen und Services des Zentralverbands.', link: 'https://www.kleingaertner.at', category: 'Links', position: 50 },
];

const LISTINGS = [
  { kind: 'biete', title: 'Rasenmäher (Elektro), gut erhalten', body: 'Elektro-Rasenmäher, wenig benutzt, mit Fangkorb. Gegen kleine Spende an die Vereinskasse abzugeben.', contact: 'in der Sprechstunde', parcel: 'Parz. 42', status: 'published' },
  { kind: 'suche', title: 'Suche Schubkarre', body: 'Für Erdarbeiten im Frühjahr, gerne auch reparaturbedürftig.', contact: 'siehe Anschlagtafel', parcel: 'Parz. 17', status: 'published' },
  { kind: 'biete', title: 'Himbeer- und Erdbeerpflanzen', body: 'Abgebbare Ausläufer aus dem eigenen Garten, kostenlos für Vereinsmitglieder.', contact: 'in der Sprechstunde', parcel: 'Parz. 8', status: 'published' },
];

function seed() {
  setDefaultSettings();
  seedAdmin();
  insertMissing('pages', PAGES, 'slug');
  insertMissing('news', NEWS, 'slug');
  insertMissing('events', EVENTS, 'title');
  insertMissing('board', BOARD, null);
  insertMissing('documents', DOCUMENTS, 'title');
  insertMissing('listings', LISTINGS, 'title');
}

function setDefaultSettings() {
  const existing = new Set(db.prepare('SELECT key FROM settings').all().map((r) => r.key));
  const missing = Object.fromEntries(
    Object.entries(SETTING_DEFAULTS).filter(([key]) => !existing.has(key)),
  );
  if (Object.keys(missing).length) setSettings(missing);
}

function seedAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@rehlacke.at';
  const password = process.env.ADMIN_PASSWORD || 'rehlacke';
  db.prepare('INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)')
    .run(email, 'Vereinsleitung', bcrypt.hashSync(password, 10), 'admin');

  console.log(`[seed] Administrator angelegt: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('[seed] Startkennwort "rehlacke" – bitte nach dem ersten Login ändern!');
  }
}

/** Fügt nur Datensätze ein, die es (nach uniqueKey) noch nicht gibt. */
function insertMissing(table, rows, uniqueKey) {
  if (!uniqueKey) {
    const n = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    if (n > 0) return;
  }
  const tx = db.transaction(() => {
    for (const row of rows) {
      if (uniqueKey) {
        const found = db.prepare(`SELECT 1 FROM ${table} WHERE ${uniqueKey} = ?`).get(row[uniqueKey]);
        if (found) continue;
      }
      const cols = Object.keys(row);
      db.prepare(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      ).run(cols.map((c) => row[c]));
    }
  });
  tx();
}

module.exports = { seed };

if (require.main === module) {
  seed();
  console.log('[seed] Fertig.');
}
