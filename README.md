# KGV An der Rehlacke – Website mit Mini-CMS

Neuentwicklung der Website des Kleingartenvereins An der Rehlacke (1220 Wien) in einem
modernen, mobiltauglichen Layout – mit einem schlanken Redaktionsbereich, über den die
Vereinsleitung alle Inhalte selbst pflegt.

## Überblick

| | |
| --- | --- |
| **Technik** | Node.js, Express 5, SQLite (better-sqlite3), EJS – keine Build-Schritte |
| **Datenbank** | eine einzige Datei unter `data/rehlacke.db` |
| **Abhängigkeiten** | 7 Pakete, keine externen Skripte oder Web-Fonts |
| **Design** | eigenes CSS-Designsystem, hell und dunkel, ohne Framework |

### Warum diese Technik

Ein Kleingartenverein braucht eine Website, die jahrelang ohne Wartung läuft und die
niemand „builden“ muss. Deshalb: server-gerendertes HTML, eine Datenbankdatei zum
Mitnehmen, keine Abhängigkeit von externen Diensten. Ein Backup ist eine Kopie von
`data/` und `uploads/`.

## Schnellstart

```bash
npm install
npm start
```

Danach im Browser öffnen:

* Website: <http://localhost:3000>
* Redaktion: <http://localhost:3000/admin>

Beim ersten Start werden die Datenbank, Beispielinhalte und ein Administratorkonto
angelegt. Ohne eigene Angaben lauten die Zugangsdaten:

```
E-Mail:   admin@rehlacke.at
Kennwort: rehlacke
```

> **Bitte das Kennwort direkt nach der ersten Anmeldung unter „Konto“ ändern.**
> Besser noch: vor dem ersten Start `ADMIN_EMAIL` und `ADMIN_PASSWORD` setzen
> (siehe `.env.example`).

### Tests

```bash
npm test
```

Prüft die öffentlichen Seiten, die Anmeldung, den CSRF-Schutz, die Moderation der
Anzeigen sowie die Text- und Datumsaufbereitung.

## Der Redaktionsbereich

Unter `/admin` pflegt die Vereinsleitung sämtliche Inhalte:

| Bereich | Inhalt |
| --- | --- |
| **Beiträge** | Neuigkeiten mit Datum, Bild, Kurzfassung und Markierung „wichtig“ |
| **Termine** | Sprechstunden, Arbeitseinsätze, Hauptversammlung, Feste |
| **Seiten** | frei anlegbare Seiten wie Ruhezeiten, Kosten, Lageplan |
| **Vereinsleitung** | Funktionen mit Namen und Erreichbarkeit (auch fürs Impressum) |
| **Dokumente** | Statuten, Gartenordnung, Beschlüsse – als Datei oder externer Link |
| **Anzeigen** | „Ich biete / Ich suche“ mit Freigabe vor der Veröffentlichung |
| **Nachrichten** | Eingänge aus dem Kontaktformular, als erledigt markierbar |
| **Medien** | Bilder und Dateien mit Pfad zum Einfügen |
| **Einstellungen** | Vereinsname, Adresse, Kontaktdaten, Sprechstunde, Startseitentexte |
| **Konto** | eigener Name, E-Mail-Adresse und Kennwort |

### Texte schreiben

Alle Textfelder verstehen **Markdown**:

```markdown
## Überschrift
**fett**, *kursiv*

- Listenpunkt
- noch ein Punkt

[Link zur Seite](/ruhezeiten)

> Hinweis in einem Kasten
```

Über „Vorschau“ im Editor lässt sich das Ergebnis vor dem Speichern ansehen.
Tabellen werden auf schmalen Bildschirmen automatisch scrollbar.

### Entwurf statt Veröffentlichung

Das Häkchen „Veröffentlicht“ steuert die Sichtbarkeit. Ohne Häkchen ist ein Inhalt
nur im Redaktionsbereich zu sehen – praktisch für Texte, die noch abgestimmt werden.

### Seiten und Menü

Neue Seiten erscheinen unter `/kürzel` und werden über das Feld **Bereich** in die
Menügruppe „Verein“ oder „Service“ einsortiert. Mit **Reihenfolge** wird die Position
gesteuert (kleinere Zahl = weiter vorne), mit **Im Hauptmenü anzeigen** die Aufnahme
in die Navigation. Kürzel, die feste Seiten belegen (etwa `kontakt`), werden
automatisch abgewandelt, damit keine Seite unerreichbar wird.

## Aufbau des Projekts

```
server.js                 Express-Anwendung, Sitzungen, Sicherheitskopfzeilen
src/
  db.js                   Datenbankschema und Einstellungen
  seed.js                 Startinhalte (läuft bei jedem Start, ändert nichts Bestehendes)
  resources.js            Beschreibung der Inhaltstypen – Basis für Listen und Formulare
  routes/public.js        Öffentliche Seiten
  routes/admin.js         Redaktionsbereich
  helpers.js              Markdown, Datumsformate, Kürzel
  icons.js                SVG-Symbole
  navigation.js           Aufbau des Hauptmenüs
  csrf.js                 Schutz vor gefälschten Formularen
  uploads.js              Datei-Uploads mit Typ- und Größenprüfung
  session-store.js        Sitzungen in SQLite
  reserved-slugs.js       Kürzel, die feste Seiten belegen
views/                    EJS-Vorlagen (öffentlich und Redaktion)
public/css/site.css       Designsystem der Website
public/css/admin.css      Redaktionsbereich
data/                     Datenbank (nicht im Repository)
uploads/                  hochgeladene Dateien (nicht im Repository)
```

### Neuen Inhaltstyp ergänzen

Listen und Formulare entstehen aus `src/resources.js`. Für einen weiteren Inhaltstyp
genügen zwei Schritte: Tabelle in `src/db.js` anlegen und einen Eintrag in
`src/resources.js` ergänzen. Der Redaktionsbereich bekommt dadurch automatisch
Übersicht, Formular, Validierung und Löschfunktion.

## Sicherheit

* Kennwörter werden mit bcrypt gespeichert, niemals im Klartext.
* Jedes Formular ist mit einem CSRF-Token geschützt.
* Nach der Anmeldung wird die Sitzungskennung erneuert (gegen Session Fixation).
* Redaktionstexte werden vor der Markdown-Verarbeitung escaped; in Links und Bildern
  sind nur `http`, `https`, `mailto`, `tel` und seiteninterne Adressen erlaubt.
* Uploads sind auf Bilder, PDF, Office-Dateien und Text beschränkt (max. 8 MB).
  Dateinamen werden neu gebildet, Pfadangaben aus dem Original verworfen.
* Eine Content-Security-Policy erlaubt ausschließlich eigene Ressourcen – die Seite
  lädt keine fremden Skripte, Schriften oder Zählpixel.
* `/admin` ist über `robots.txt` und `noindex` von Suchmaschinen ausgenommen.

## Datenschutz

Die Website setzt ein einziges Cookie, und zwar nur für die Anmeldung im
Redaktionsbereich. Es gibt kein Tracking, keine Analysedienste und keine externen
Einbettungen. Damit ist kein Cookie-Banner erforderlich.

## Betrieb

### Voraussetzungen

Node.js 20 oder neuer.

### Konfiguration

`.env.example` nach `.env` kopieren und ausfüllen. Wichtig für den Produktivbetrieb:

* `SESSION_SECRET` auf einen zufälligen Wert setzen – sonst werden Anmeldungen bei
  jedem Neustart ungültig.
* `NODE_ENV=production` setzen, damit Cookies nur über HTTPS gesendet werden.

### Dauerbetrieb mit systemd

```ini
# /etc/systemd/system/rehlacke.service
[Unit]
Description=Website KGV An der Rehlacke
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/rehlacke
EnvironmentFile=/var/www/rehlacke/.env
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now rehlacke
```

Davor gehört ein Webserver (nginx, Caddy oder Apache), der HTTPS bereitstellt und an
`http://127.0.0.1:3000` weiterleitet. Bei nginx zusätzlich `client_max_body_size 10M;`
setzen, damit Uploads nicht am Webserver scheitern.

### Sicherung

Zu sichern sind genau zwei Verzeichnisse:

```bash
tar czf rehlacke-$(date +%F).tar.gz data uploads
```

## Hinweis zu den Inhalten

Struktur und Bereiche entsprechen der bisherigen Website (Verein, Ruhezeiten, Kosten,
Gartenfachberatung, Lageplan, Downloads, Ich biete / Ich suche, Impressum). Adresse,
ZVR-Zahl, Telefonnummer, E-Mail-Adresse und die Ruhezeiten-Regelung sind übernommen.

Die übrigen Texte – etwa die Beträge auf der Seite „Kosten“, die Namen der
Vereinsleitung und die Beispieltermine – sind Platzhalter und im Redaktionsbereich zu
ersetzen. Dokumente wie Statuten und Gartenordnung sind als Einträge angelegt; die
zugehörigen PDF-Dateien müssen noch hochgeladen werden.
