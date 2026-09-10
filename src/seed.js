'use strict';

/**
 * Legt Standardinhalte an. Läuft beim Serverstart und ist idempotent:
 * bestehende Datensätze werden nie überschrieben.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db, setSettings, SETTING_DEFAULTS } = require('./db');

const ASSET_SOURCE = path.join(__dirname, '..', 'seed-assets');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

/*
 * Dateien, die aus der bisherigen Website übernommen wurden. Sie liegen im
 * Repository unter seed-assets/ und werden beim ersten Start in den
 * Upload-Ordner kopiert, damit sie unabhängig vom alten Anbieter erhalten
 * bleiben.
 */
const ASSETS = [
  { file: 'statuten-und-gartenordnung.pdf', mime: 'application/pdf', original: 'Statuten u. Gartenordnung 2009-24.pdf' },
  { file: 'aushang-fruehling-2026.pdf', mime: 'application/pdf', original: '2026-Frühling_Aushang_22.Bez.pdf' },
  { file: 'was-gehoert-in-die-biotonne.pdf', mime: 'application/pdf', original: 'Bio-Tonnen.pdf' },
  { file: 'anlage-1.jpg', mime: 'image/jpeg', original: 'Anlage1.jpg' },
  { file: 'anlage-2.jpg', mime: 'image/jpeg', original: 'Anlage2.jpg' },
  { file: 'anlage-3.jpg', mime: 'image/jpeg', original: 'Anlage3.jpg' },
  { file: 'anlage-4.jpg', mime: 'image/jpeg', original: 'Anlage4.jpg' },
  { file: 'anlage-5.jpg', mime: 'image/jpeg', original: 'Anlage5.jpg' },
];

const PAGES = [
  {
    slug: 'verein',
    title: 'Vereinsinformationen',
    nav_title: 'Vereinsinformationen',
    section: 'verein',
    position: 10,
    intro: 'Wer wir sind – und warum wir derzeit keine Anmeldungen entgegennehmen können.',
    body: `> **Keine Anmeldungen möglich**
>
> Sehr geehrte Besucher, falls Sie auf der Suche nach einem Kleingarten sind, hier die schlechte Nachricht: bedingt durch die starke Nachfrage nach Kleingärten und die Länge unserer Warteliste, nehmen wir bis auf weiteres keine Anmeldungen entgegen.

## Die Anlage

Der Kleingartenverein An der Rehlacke liegt in der Wiener Donaustadt und umfasst rund 160 Parzellen. Der Verein besteht seit 1958 und ist Mitglied im Zentralverband der Kleingärtner und Siedler Österreichs.

## Organisation

Oberstes Organ des Vereins ist die Hauptversammlung. Sie wählt die Vereinsleitung und beschließt die Grundsätze des Vereinslebens. Grundlage der täglichen Arbeit sind die Statuten, die Gartenordnung und die Beschlüsse der Hauptversammlung.

- [Vereinsleitung](/vereinsleitung) – Funktionen und Erreichbarkeit
- [Statuten und Gartenordnung](/downloads) – im Downloadbereich
- [Beschlüsse der Hauptversammlung](/beschluesse-hv)
- [Ruhezeiten](/ruhezeiten) und [Kosten](/kosten)

## Anliegen und Fragen

Sprechstunden sind jederzeit nach persönlicher oder telefonischer Voranmeldung möglich. Rufen Sie dazu bitte **+43 000 000 0000** an oder nutzen Sie das [Kontaktformular](/kontakt).`,
  },
  {
    slug: 'ruhezeiten',
    title: 'Ruhezeiten',
    nav_title: 'Ruhezeiten',
    section: 'verein',
    position: 20,
    intro: 'Damit sich alle erholen können, gelten in der Anlage verbindliche Ruhezeiten.',
    body: `Sehr geehrte Mitglieder,

zwischen **15. April und 15. September** gilt die Mittagsruhe.

## Bitte vermeiden Sie zu folgenden Zeiten unnötigen Lärm

- **Täglich** von 22:00 – 06:00 Uhr
- **Montag bis Samstag** von 12:00 – 15:00 Uhr
- **Sonn- und Feiertag** ab 12:00 Uhr

An Sonn- und Feiertagen sind lärmende Arbeiten außerdem nur zwischen **09:00 und 12:00 Uhr** gestattet.

## Bauarbeiten

In den Monaten **Juli und August** dürfen weder Abbruch- und Aushubarbeiten noch von der MA 37 bewilligungspflichtige Bauarbeiten durchgeführt werden.

## Außentore

Während der Sommerzeit bleiben die Außentore der Anlage bis zum Einbruch der Dunkelheit geöffnet.

*Grundlage: § 7 der Gartenordnung sowie die Beschlüsse der Hauptversammlungen vom 20. April 2018 und 19. April 2024 – siehe [Beschlüsse der Hauptversammlung](/beschluesse-hv).*`,
  },
  {
    slug: 'kosten',
    title: 'Kosten 2026',
    nav_title: 'Kosten',
    section: 'verein',
    position: 30,
    intro: 'Pacht, Beiträge und laufende Abgaben je Parzelle im Überblick.',
    body: `## Vorschreibung Pächter

| Position | Entgelt/m² |
| --- | --- |
| Pacht inkl. Grundsteuer | 1,76 €/m² |
| Gemeinschaftsflächen | 1,76 €/m² |
| Zuschlag „größer bauen" | 1,40 €/m² |
| Zuschlag „ständig wohnen" | 0,968 €/m² |

## Vorschreibung Eigentümer

| Position | Entgelt/m² |
| --- | --- |
| Pacht inkl. Grundsteuer | 0,00 €/m² |
| Gemeinschaftsflächen | 1,76 €/m² |
| Zuschlag „größer bauen" | 0,00 €/m² |
| Zuschlag „ständig wohnen" | 0,00 €/m² |

## Beiträge je Parzelle

| Position | Entgelt |
| --- | --- |
| Mitgliedsbeitrag Zentral- und Landesverband, BO | 16,66 € |
| Pauschale zur Abdeckung gemeinsamer Kosten | 70,00 € |
| Wassergebühr | 3,76 €/m³ |
| Müll für 120 l, 52 Entleerungen | 216,75 € |

## Zahlung

Die Vorschreibung erfolgt schriftlich. Bitte geben Sie bei der Überweisung immer **Parzellennummer und Name** als Zahlungsreferenz an.`,
  },
  {
    slug: 'beschluesse-hv',
    title: 'Beschlüsse der Hauptversammlung',
    nav_title: 'Beschlüsse HV',
    section: 'verein',
    position: 40,
    intro: 'Die gültigen Beschlüsse der Hauptversammlungen, chronologisch geordnet.',
    body: `## Hauptversammlung vom 19. April 2024

In den Monaten Juli und August dürfen weder Abbruch- und Aushubarbeiten noch von der MA 37 bewilligungspflichtige Bauarbeiten durchgeführt werden.

## Hauptversammlung vom 20. April 2018

- Änderung der Ruhezeiten: Die in § 7 Gartenordnung angeführten Ruhezeiten gelten nun nicht mehr während der Sommerzeit, sondern zwischen 15. April und 15. September.

## Hauptversammlung vom 21. April 2017

- Der Obmann verfügt über ein Budget von 1.000 €.
- Ausgaben bis 10.000 € entscheidet die Vereinsleitung.
- Investitionen über 10.000 € bedürfen der Zustimmung der Hauptversammlung.

## Hauptversammlung vom 29. April 2011

- Erhöhung der Vereinsumlage auf 70 € pro Jahr und Parzelle.`,
  },
  {
    slug: 'gartenfachberatung',
    title: 'Gartenfachberatung',
    nav_title: 'Gartenfachberatung',
    section: 'verein',
    position: 50,
    intro: 'Hinweise der Fachberatung, Aushänge und die Biotonnen des Vereins.',
    body: `## Biotonnen ausleihen

Sie können gerne **Biotonnen beim Vereinshaus ausleihen**. Dazu bitte SMS oder Anruf an die Vereinsleitung (**+43 000 000 0000**), damit die Verfügbarkeit koordiniert werden kann.

Die Entleerung der Biotonnen findet **bei Tor 1** statt – bitte unbedingt dort zur Entleerung bringen (auch wenn dies manchmal mühsam ist), sonst vagabundieren die Biotonnen in unserer Anlage und sind bei Bedarf nicht verfügbar.

Die Entleerungstermine finden Sie unter [Müllentleerung](/muellentleerung).

## Aushänge und Unterlagen

Die Aushänge der Fachberatung sowie das Informationsblatt „Was gehört in die Biotonne?" liegen im [Downloadbereich](/downloads).`,
  },
  {
    slug: 'geschichte',
    title: 'Geschichte in Bildern',
    nav_title: 'Geschichte',
    section: 'service',
    position: 10,
    intro: 'Historische Luftbilder aus dem Vereinsarchiv – die beschrifteten Aufnahmen reichen von 1929 bis 1967.',
    body: `Der Verein besteht seit 1958. Die folgenden Luftbilder aus dem Vereinsarchiv zeigen die Anlage und ihre Umgebung in der Donaustadt über mehrere Jahrzehnte – von Feldern und Fabriken bis zu den heutigen Wohnbauten. Die Angaben in den Bildunterschriften sind, soweit vorhanden, von den handschriftlichen Beschriftungen der Abzüge übernommen.

![Zwei Luftbilder der Erzherzog-Karl-Straße von 1929 und 1936](/uploads/anlage-5.jpg)

*Zwei Aufnahmen auf einem Blatt. Oben: „Erzh. Karl Strasse, Juli 1929" – Felder, Alleen und einzelne Gebäude. Unten: „Magdeburgstr. – Erzh. Karl Str., 7. 11. 1936" – im Bild der Teich und die ersten Bauten.*

![Luftbild Industriestraße und Erzherzog-Karl-Straße vom 15. September 1931](/uploads/anlage-4.jpg)

*„Industriestr. – Erzherzog Karlstr., 15. 9. 1931" (Bildnummer 767).*

![Luftbild eines Fabrikgeländes mit angrenzenden Kleingartenparzellen](/uploads/anlage-1.jpg)

*Fabrikgelände mit den angrenzenden Kleingartenparzellen – rechts unten sind die Wege und Beete gut zu erkennen. Ohne Beschriftung.*

![Luftbild über Siedlungen, Felder und Verkehrswege](/uploads/anlage-3.jpg)

*Übersicht über Siedlungen, Felder und Verkehrswege. Ohne Beschriftung.*

![Luftbild der Donaustadt mit neuen Wohnbauten, auf dem Träger mit 1967 bezeichnet](/uploads/anlage-2.jpg)

*Blick über die entstehenden Wohnbauten. Auf dem Träger handschriftlich mit **1967** bezeichnet.*

## Hinweise zu den Bildern

Die Aufnahmen stammen aus dem Vereinsarchiv und wurden von gerahmten Abzügen abfotografiert; daher sind teils Rahmen, Träger und Beschriftungen mit im Bild. Wenn Sie zu einem Bild Jahr, Ort oder Namen ergänzen oder eine Angabe berichtigen können, freut sich die Vereinsleitung über eine [Nachricht](/kontakt).`,
  },
  {
    slug: 'muellentleerung',
    title: 'Müllentleerung',
    nav_title: 'Müllentleerung',
    section: 'service',
    position: 20,
    intro: 'Termine für die Entleerung der Biotonnen.',
    body: `## Termine für die Biotonnen-Entleerung

- 4. und 18. Dezember 2025
- 2., 15. und 29. Jänner 2026
- 12. und 26. Feber 2026
- 12. und 26. März 2026

## Bitte beachten

Die Entleerung findet **bei Tor 1** statt. Bringen Sie die Tonnen bitte rechtzeitig dorthin und holen Sie sie nach der Entleerung wieder ab.

Biotonnen können beim Vereinshaus ausgeliehen werden – siehe [Gartenfachberatung](/gartenfachberatung).`,
  },
  {
    slug: 'lageplan',
    title: 'Lageplan',
    nav_title: 'Lageplan',
    section: 'service',
    position: 30,
    intro: 'Orientierung in der Anlage: Tore, Wege und Parzellen.',
    body: `## Anlage und Zufahrt

Die Anlage ist über die **Benatzkygasse** erreichbar. Der Vereinssitz liegt bei **Tor 1, Parzelle 1**. Bitte halten Sie die Tore geschlossen und die Zufahrtswege für Rettung und Feuerwehr frei.

Während der Sommerzeit bleiben die Außentore bis zum Einbruch der Dunkelheit geöffnet.

## Anreise

- **Öffentlich:** U1 Richtung Kaisermühlen / Alte Donau, weiter mit dem Bus
- **Fahrrad:** über den Donauradweg
- **Auto:** Parken ausschließlich auf den gekennzeichneten Flächen

*Der Parzellenplan kann im Redaktionsbereich als Bild oder PDF hinterlegt werden.*`,
  },
  {
    slug: 'links',
    title: 'Links',
    nav_title: 'Links',
    section: 'service',
    position: 40,
    intro: 'Weiterführende Seiten für Kleingärtnerinnen und Kleingärtner.',
    body: `## Recht

- [Wiener Kleingartengesetz](https://www.wien.gv.at/recht/landesrecht-wien/rechtsvorschriften/html/b2400000.htm)

## Verbände

- [Zentralverband der Wiener Kleingärtner](https://www.kleingaertner.at/)`,
  },
  {
    slug: 'todesfaelle',
    title: 'Todesfälle',
    nav_title: 'Todesfälle',
    section: 'service',
    position: 50,
    intro: 'Wir gedenken der verstorbenen Mitglieder unseres Vereins.',
    body: `**2025:** Peter Gavac

**2024:** Walter Rosenkranz · Herta Budik · Edeltraud Yildirim · Herbert Hawle · Erika Heger · Christine Rosenkranz · Ernst Wunsch · Margarete Hogn

**2023:** Maria Hybek

**2022:** Erika Himmer · Johann Gmach

**2021:** Ernst Reiter · Elisabeth Mayer · Michael Wenusch · Michael Svatos · Ina Connerth

**2020:** Angela Deimböck · Anna Pfannenstiel

**2019:** Gerhard Svatos · Hildegard Zech · Edgar Schöller · Herbert Etl · Otto Hofstätter

**2018:** Ernst Hogn · Peter Handl · Robert Bauer · Brigitte Loidl

**2017:** Franz Vorstandlechner · Engelbert Ranftl · Michaela Pfann · Herbert Pfannenstiel

**2016:** Franz Richter · Kurt Palka · Karl Mayer · Eveline Andrlik

**2015:** Franz Einsiedler · Kurt Novak · Robert Tscherney

**2014:** Brigitta Ranftl · Frederike Wegmann · Herta Frischherz · Hannes Stadler`,
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

Verantwortlich für die Datenverarbeitung ist der Kleingarten Verein an der Rehlacke. Die Kontaktdaten finden Sie im [Impressum](/impressum).

## Welche Daten verarbeitet werden

- **Kontaktformular:** Name, E-Mail-Adresse und Ihre Nachricht, um die Anfrage zu bearbeiten.
- **Anzeigen im Bereich „Ich biete / Ich suche":** die von Ihnen angegebenen Kontaktdaten, um die Anzeige zu veröffentlichen.
- **Server-Logfiles:** technisch notwendige Daten zum Betrieb der Website.

## Cookies und Tracking

Diese Website setzt ausschließlich ein technisch notwendiges Cookie für die Anmeldung im Redaktionsbereich. Es findet **kein Tracking** statt, es werden keine Analysedienste eingesetzt und keine Inhalte von Dritten nachgeladen.

## Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Widerspruch. Wenden Sie sich dazu an die im Impressum genannte Adresse.`,
  },
];

const NEWS = [
  {
    slug: 'achtung-einbrecher',
    title: 'Achtung – Einbrecher',
    excerpt: 'Bitte beachten Sie einige Sicherheitshinweise für Ihr Gartenhaus.',
    body: `Beachten Sie einige Sicherheitshinweise:

- Beleuchten Sie Ihre Eingangstür sowie uneinsichtige Teile Ihres Hauses.
- Versperren Sie Leitern und sperren Sie Ihren Geräteschuppen ab.
- Installieren Sie eine Alarmanlage.
- Melden Sie verdächtige Personen bei der Polizei.
- Sperren Sie die Außentore ab.

**Machen Sie Ihr Haus für Einbrecher so unattraktiv wie möglich!**`,
    published_at: '',
    pinned: 1,
  },
  {
    slug: 'nachbarschaftsrecht-am-gartenzaun',
    title: 'Lesenswert: Streit am Gartenzaun',
    excerpt: 'Ein Artikel zum Nachbarschaftsrecht – Grenzbepflanzung, Fallobst und Laub.',
    body: `Hier finden Sie einen interessanten Artikel zum Thema Nachbarschaftsrecht:

[Grenzbepflanzung, Fallobst, Laub – Streit am Gartenzaun](https://ratgeber.immowelt.at/a/grenzbepflanzung-fallobst-laub-streit-am-gartenzaun.html)`,
    published_at: '',
  },
];

const EVENTS = [
  {
    title: 'Spanferkelessen',
    starts_at: '2026-06-20T17:15',
    ends_at: '2026-06-20T22:00',
    location: 'Vereinshaus',
    description: 'Aufwärmen und Vorglühen ab 17:15, Ankunft Spanferkel 17:50, Schmausbeginn 18:00, Ende 22:00.',
  },
  {
    title: 'Feierabend',
    starts_at: '2026-07-18',
    all_day: 1,
    location: 'Vereinshaus',
    description: 'Gemeinsamer Feierabend im Verein.',
  },
  {
    title: 'Feierabend',
    starts_at: '2026-08-15',
    all_day: 1,
    location: 'Vereinshaus',
    description: 'Gemeinsamer Feierabend im Verein.',
  },
];

const BOARD = [
  {
    name: 'Michael Stocker',
    role: 'Obmann',
    email: 'office@example.org',
    phone: '+43 000 000 0000',
    position: 10,
    note: 'Sprechstunde nach persönlicher oder telefonischer Voranmeldung.',
  },
  { name: 'Manfred Loidl', role: 'Obmann-Stellvertreter', position: 20 },
  { name: 'Ilse Meier', role: 'Kassierin', position: 30 },
  { name: 'Barbara Gressler', role: 'Kassierin-Stellvertreterin', position: 40 },
  { name: 'Brigitte Nuhsbaumer', role: 'Schriftführerin', position: 50 },
  { name: 'Renate Biberle', role: 'Schriftführerin-Stellvertreterin', position: 60 },
  { name: 'Heinz Häller', role: 'Kontrolle', position: 70 },
  { name: 'Günther Heel', role: 'Kontrolle', position: 80 },
  { name: 'Karl Mahr', role: 'Kontrolle', position: 90 },
];

const DOCUMENTS = [
  {
    title: 'Statuten und Gartenordnung',
    description: 'Rechtliche Grundlage des Vereins und Regeln für die Nutzung der Parzellen (Ausgabe 2009/24, 8 Seiten).',
    file: '/uploads/statuten-und-gartenordnung.pdf',
    category: 'Statuten & Ordnung',
    position: 10,
  },
  {
    title: 'Aushang Frühling 2026',
    description: 'Aushang der Gartenfachberatung für den 22. Bezirk.',
    file: '/uploads/aushang-fruehling-2026.pdf',
    category: 'Gartenfachberatung',
    position: 20,
  },
  {
    title: 'Was gehört in die Biotonne?',
    description: 'Informationsblatt zur richtigen Trennung von Bioabfall.',
    file: '/uploads/was-gehoert-in-die-biotonne.pdf',
    category: 'Gartenfachberatung',
    position: 30,
  },
  {
    title: 'Wiener Kleingartengesetz',
    description: 'Der Gesetzestext im Rechtsinformationssystem der Stadt Wien.',
    link: 'https://www.wien.gv.at/recht/landesrecht-wien/rechtsvorschriften/html/b2400000.htm',
    category: 'Gesetz & Verbände',
    position: 40,
  },
  {
    title: 'Zentralverband der Wiener Kleingärtner',
    description: 'Informationen und Services des Zentralverbands.',
    link: 'https://www.kleingaertner.at/',
    category: 'Gesetz & Verbände',
    position: 50,
  },
];

const LISTINGS = [];

function seed() {
  setDefaultSettings();
  seedAdmin();
  installAssets();
  insertMissing('pages', PAGES, 'slug');
  insertMissing('news', NEWS, 'slug');
  insertMissing('events', EVENTS, ['title', 'starts_at']);
  insertMissing('board', BOARD, null);
  insertMissing('documents', DOCUMENTS, 'title');
  insertMissing('listings', LISTINGS, 'title');
}

/**
 * Kopiert die übernommenen Dateien in den Upload-Ordner und verzeichnet sie in
 * der Mediathek. Vorhandene Dateien werden nicht überschrieben.
 */
function installAssets() {
  if (!fs.existsSync(ASSET_SOURCE)) return;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const known = db.prepare('SELECT 1 FROM media WHERE file = ?');
  const record = db.prepare(
    'INSERT INTO media (file, original, mime, size) VALUES (?, ?, ?, ?)',
  );

  let copied = 0;
  for (const asset of ASSETS) {
    const source = path.join(ASSET_SOURCE, asset.file);
    if (!fs.existsSync(source)) continue;

    const target = path.join(UPLOAD_DIR, asset.file);
    if (!fs.existsSync(target)) {
      fs.copyFileSync(source, target);
      copied += 1;
    }
    if (!known.get(`/uploads/${asset.file}`)) {
      record.run(`/uploads/${asset.file}`, asset.original, asset.mime, fs.statSync(target).size);
    }
  }

  if (copied) console.log(`[seed] ${copied} übernommene Datei(en) in den Upload-Ordner kopiert.`);
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

  /*
   * Kein festes Standardkennwort: ein im Quellcode stehendes Kennwort wäre für
   * jeden nachlesbar, der das Repository sieht. Ohne ADMIN_PASSWORD wird daher
   * ein zufälliges erzeugt und einmalig ausgegeben.
   */
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD
    || crypto.randomBytes(9).toString('base64url');

  db.prepare('INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)')
    .run(email, 'Vereinsleitung', bcrypt.hashSync(password, 10), 'admin');

  console.log(`[seed] Administrator angelegt: ${email}`);
  if (generated) {
    console.log('[seed] ---------------------------------------------------------');
    console.log(`[seed] Startkennwort: ${password}`);
    console.log('[seed] Es wird nur dieses eine Mal angezeigt. Notieren und nach');
    console.log('[seed] dem ersten Login unter "Konto" ändern.');
    console.log('[seed] ---------------------------------------------------------');
  }
}

/**
 * Fügt nur Datensätze ein, die es noch nicht gibt.
 * `uniqueKey` ist eine Spalte oder eine Liste von Spalten; ohne Angabe wird
 * die Tabelle nur befüllt, wenn sie leer ist.
 */
function insertMissing(table, rows, uniqueKey) {
  const keys = uniqueKey ? [].concat(uniqueKey) : null;
  if (!keys) {
    const n = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    if (n > 0) return;
  }
  const tx = db.transaction(() => {
    for (const row of rows) {
      if (keys) {
        const where = keys.map((k) => `${k} = ?`).join(' AND ');
        const found = db.prepare(`SELECT 1 FROM ${table} WHERE ${where}`).get(keys.map((k) => row[k]));
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
