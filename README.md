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

Beim ersten Start werden die Datenbank, die Startinhalte und ein Administratorkonto
angelegt. Das Kennwort wird dabei **zufällig erzeugt und einmalig im Protokoll
ausgegeben**:

```
[seed] Administrator angelegt: admin@rehlacke.at
[seed] ---------------------------------------------------------
[seed] Startkennwort: 4e4iIrdKt7lO
[seed] Es wird nur dieses eine Mal angezeigt. Notieren und nach
[seed] dem ersten Login unter "Konto" ändern.
[seed] ---------------------------------------------------------
```

Ein festes Kennwort im Quellcode gibt es bewusst nicht – es wäre für jeden nachlesbar,
der das Repository sieht. Wer das Kennwort selbst bestimmen will, setzt vor dem ersten
Start `ADMIN_EMAIL` und `ADMIN_PASSWORD` (siehe `.env.example`); dann wird nichts
ausgegeben.

Ist das Kennwort verloren, hilft: `data/` löschen und neu starten – dann werden Konto und
Startinhalte neu angelegt (gepflegte Inhalte gehen dabei verloren).

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

### Statischer Abzug auf GitHub Pages

Neben der laufenden Anwendung gibt es einen statischen Abzug der öffentlichen Seiten. Er
eignet sich, um der Vereinsleitung die Seite zum Durchklicken zu geben, ohne dass jemand
etwas installieren muss.

```bash
npm run export          # nach dist/, Basispfad /KLGVRehlacke/
BASE_PATH=/ npm run export
INDEXABLE=1 npm run export
```

Der Export erzeugt eine echte Datei je Adresse (`ruhezeiten/index.html` und so weiter),
kopiert Stylesheets, Schriften, Bilder und Uploads dazu und schreibt eine `404.html`.

Automatisch veröffentlicht wird er von `.github/workflows/pages.yml` bei jedem Push auf
`master`. Der Basispfad kommt aus `actions/configure-pages`, der Export stimmt daher
sowohl für die Projektseite als auch für eine eigene Domain.

#### Voraussetzung: GitHub Pages muss verfügbar sein

**Dieses Repository ist privat, und für private Repositories bietet GitHub Pages nur in
den bezahlten Plänen (Pro, Team, Enterprise) an.** Auf dem kostenlosen Plan lässt sich
Pages daher nicht einschalten – der Arbeitsablauf scheitert dann im Schritt
*Pages einrichten* mit `Resource not accessible by integration`, weil GitHub dem
Workflow-Token das Anlegen der Pages-Site verweigert.

Es gibt drei Wege:

1. **Repository öffentlich machen.** Pages ist dann im kostenlosen Plan enthalten, und
   der Arbeitsablauf richtet alles selbst ein (`enablement: true`). Zu bedenken: damit
   werden auch die Namen der Vereinsleitung, die Liste der Todesfälle und die Unterlagen
   des Vereins über GitHub öffentlich – Inhalte, die auf der Vereinswebsite ohnehin
   öffentlich stehen, aber eben zusätzlich an einer zweiten Stelle.
2. **GitHub Pro** (etwa 4 $ im Monat) freischalten. Das Repository bleibt privat, die
   veröffentlichte Seite ist trotzdem öffentlich erreichbar – Pages hinter Anmeldung gibt
   es nur in Enterprise.
3. **Auf Pages verzichten.** Der statische Abzug lässt sich mit `npm run export` jederzeit
   lokal bauen und von jedem Webspace ausliefern. Für den Dauerbetrieb ist ohnehin die
   laufende Anwendung gedacht (siehe unten), weil nur sie den Redaktionsbereich mitbringt.

Ist Pages verfügbar, muss nichts von Hand eingerichtet werden: der Arbeitsablauf übergibt
`enablement: true`, womit `actions/configure-pages` die Pages-Site beim ersten Lauf selbst
anlegt. Alternativ von Hand unter *Settings → Pages* die Quelle auf *GitHub Actions*
stellen.

Drei Dinge, die dieser Abzug bewusst nicht kann:

* **Er zeigt die Startinhalte, nicht die gepflegten.** Die Inhalte liegen in einer
  SQLite-Datei, die nicht im Repository ist. Auf dem Bauserver gibt es sie also nicht, und
  der Abzug entsteht aus `src/seed.js`. Was die Vereinsleitung später im Redaktionsbereich
  ändert, erscheint dort nicht.
* **Formulare sind abgeschaltet.** Kontakt und Anzeigen brauchen den Server; im Abzug sind
  die Felder deaktiviert und tragen einen Hinweis (`public/js/static.js`).
* **Der Redaktionsbereich fehlt** und der Link darauf wird entfernt.

Der Abzug ist außerdem auf `noindex` gestellt und liefert ein sperrendes `robots.txt`,
damit er der echten Vereinsseite in Suchmaschinen keine Konkurrenz macht. Wer den Export
selbst als Website betreibt, setzt `INDEXABLE=1`.

### In der Cloud betreiben

**Die eine harte Anforderung: dauerhafter Speicher.** Datenbank und Uploads sind Dateien
auf der Platte. Plattformen mit flüchtigem Dateisystem – Vercel, Netlify, Cloudflare
Pages und Workers, Heroku ohne Volume – verlieren bei jedem Neustart alle Inhalte, die
der Verein eingetragen hat. Sie kommen also nicht in Frage, so bequem ihr Deployment
auch ist.

Gebraucht wird ein Volume, eingehängt unter `/data`. Die Pfade sind über Umgebungs­variablen
gesetzt, es ist also keine Codeänderung nötig:

| Variable | Wert im Container | Zweck |
| --- | --- | --- |
| `DATA_DIR` | `/data/db` | SQLite-Datenbank |
| `UPLOAD_DIR` | `/data/uploads` | hochgeladene Dateien |
| `SESSION_SECRET` | zufälliger Wert | **muss gesetzt sein**, sonst gehen Anmeldungen bei jedem Neustart verloren |
| `NODE_ENV` | `production` | Cookies nur über HTTPS |
| `PORT` | `3000` | Standard des Abbilds |

Das mitgelieferte `Dockerfile` läuft auf jeder dieser Plattformen:

| Plattform | Deployment bei `git push` | Volume | Größenordnung |
| --- | --- | --- | --- |
| **Hetzner** (Falkenstein/Nürnberg) mit Coolify oder Dokploy | ja, nach Einrichtung | lokale Platte | ab ~4 €/Monat |
| **Render** (Region Frankfurt) | ja, nativ über GitHub | Persistent Disk | ab ~7 $/Monat + Disk |
| **Railway** | ja, nativ über GitHub | Volume | nutzungsabhängig |
| **Fly.io** (Region `fra`) | über GitHub Action | Volume | ab ~3 $/Monat |
| **Hetzner** mit systemd | über GitHub Action (SSH) | lokale Platte | ab ~4 €/Monat |

Empfehlung für den Verein: **Hetzner mit Coolify.** Der Server steht in der EU, was bei
Mitgliederdaten und Nachrichten aus dem Kontaktformular das wenigste Erklären verlangt,
die Kosten liegen bei rund 4 € im Monat, und Coolify liefert das Deployment bei `git push`
mitsamt Let’s-Encrypt-Zertifikat. Wer möglichst wenig selbst verwalten will, nimmt
Render – dort genügt es, das Repository zu verbinden, ein Volume auf `/data` zu legen und
die Variablen oben zu setzen.

Zwei Dinge, die beim Umzug leicht übersehen werden:

* **Die Domain** `rehlacke.at` zeigt derzeit auf Webnode. Nach dem Deployment muss der
  DNS-Eintrag umgestellt werden – am besten erst dann, wenn die neue Seite erreichbar ist.
* **Das Volume gehört ins Backup.** Ein Abbild lässt sich jederzeit neu bauen, `/data`
  nicht.

Das Abbild wurde in dieser Umgebung nicht gebaut (kein Docker-Daemon verfügbar). Geprüft
sind die Vollständigkeit der kopierten Dateien, der Start mit `NODE_ENV=production` und
ausgelagerten Datenpfaden sowie der Healthcheck-Befehl.

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

Die Inhalte sind aus der bisherigen Website (Webnode) **übernommen**: Vereinsleitung mit
allen Funktionen, Kostentabelle 2026, Ruhezeiten, Beschlüsse der Hauptversammlungen
2011–2024, Gartenfachberatung, Biotonnen-Entleerungstermine, Links, Todesfälle sowie
Adresse, ZVR-Zahl, Telefonnummer und E-Mail-Adresse.

### Marke

Die Bildmarke liegt als Inline-SVG in `src/logo.js` und kommt in drei Ausbaustufen,
weil Haus, Baum, Zaun und Teich bei kleinen Größen ineinanderlaufen:

| Fassung | Einsatz |
| --- | --- |
| `scene()` | vollständige Szene in Farbe – Markenband der Startseite |
| `roundel()` | Linienfassung im Kreis, einfarbig – Seitenkopf, Fußbereich, Stempel |
| `favicon()` | weiter reduziert – `public/img/favicon.svg` |

Die Farben der Szene stehen als Tokens (`--lg-*`) in `site.css` und sind für hell und
dunkel getrennt gesetzt: Haus, Zaun und Stämme werden auf dunklem Grund hell, die Sonne
bleibt warm. Das ist keine Umkehrung, sondern eine eigene dunkle Fassung.

Die farbige Szene braucht einen hellen Grund. Sie steht deshalb im Markenband unter dem
Titelbereich, nicht im Titelbereich selbst – dort trägt die Linienfassung im Seitenkopf.

Wortmarke, Claim und die kleine Zeile darüber sind Einstellungen
(*Einstellungen → Website*) und damit ohne Codeänderung austauschbar.

**Schrift:** Die Wortmarke ist in *Nunito Sans* gesetzt (SIL Open Font License), selbst
gehostet unter `public/fonts/` in drei Schnitten (400/700/800, zusammen 42 KB). Kein
externer Schriftdienst – die Content-Security-Policy erlaubt nur eigene Ressourcen. Der
Lizenztext liegt unter `/fonts/LICENSE-Nunito-Sans.txt`.

Die Überschriften stehen ebenfalls in Nunito Sans (Schnitt 800), mit nach Schriftgrad
gestufter Laufweite: je größer der Grad, desto enger – eine Sans braucht das, wo eine
Serifenschrift ohne auskommt. Der Lauftext liegt weiterhin auf der Systemschrift; das hält
die Seite schnell. Soll auch er auf Nunito Sans laufen, genügt eine Zeile in `site.css`
(`body { font-family: var(--font-brand); }`), der Schnitt 400 ist bereits eingebunden.

### Mitgelieferte Dateien

Die Dokumente und Bilder der bisherigen Website liegen im Repository unter
`seed-assets/` und werden beim ersten Start in den Upload-Ordner kopiert und in der
Mediathek verzeichnet. Damit bleiben sie erhalten, wenn die alte Seite abgeschaltet wird:

| Datei | Inhalt |
| --- | --- |
| `statuten-und-gartenordnung.pdf` | Statuten und Gartenordnung, Ausgabe 2009/24 (8 Seiten) |
| `aushang-fruehling-2026.pdf` | Aushang der Gartenfachberatung, Frühling 2026 |
| `was-gehoert-in-die-biotonne.pdf` | Informationsblatt zum Bioabfall |
| `anlage-1.jpg` … `anlage-5.jpg` | fünf historische Luftbilder, beschriftet 1929 bis 1967 |

Die Luftbilder sind auf der Seite *Geschichte in Bildern* zusammengestellt. Die
Bildunterschriften geben die handschriftlichen Beschriftungen der Abzüge wieder
(„Erzh. Karl Strasse, Juli 1929", „Industriestr. – Erzherzog Karlstr., 15. 9. 1931",
„Magdeburgstr. – Erzh. Karl Str., 7. 11. 1936" sowie ein mit 1967 bezeichnetes Blatt);
zwei Aufnahmen sind unbeschriftet.

### Personenbezogene Kontaktdaten

Telefonnummer und E-Mail-Adresse der bisherigen Website gehören einer Person, nicht dem
Verein (private Mobilnummer, private Adresse bei einem Freemail-Anbieter). Die Seite zeigt
sie daher nur dort, wo sie hingehören:

| Ort | Was steht dort |
| --- | --- |
| **Impressum** | die echten Daten – Pflichtangabe nach § 5 ECG |
| **Kontakt** | die echten Daten – wer diese Seite öffnet, sucht sie gezielt |
| **Vereinsleitung** | die echten Daten beim Obmann, wie auf der bisherigen Website |
| Startseite, Fußbereich, Seitenspalten | nichts Persönliches, nur ein Verweis auf das Kontaktformular |

Sobald der Verein eine eigene Adresse hat (etwa `office@rehlacke.at`) und eventuell ein
Vereinstelefon, gehören sie unter *Einstellungen → Verein und Kontakt* in die Felder
**Vereins-E-Mail, öffentlich** und **Vereinstelefon, öffentlich**. Dann erscheinen sie an
den sichtbaren Stellen und der Verweis auf das Formular entfällt – ohne Codeänderung.

Solange diese Felder leer sind, steht auf der Startseite und im Fußbereich keine private
Nummer und keine private Adresse.

### Was noch zu tun ist

* **Todesfälle.** Die Namen sind übernommen. Die zugehörigen Partezettel liegen als
  einzelne Dateien beim alten Anbieter und wurden nicht mitübernommen – auf Wunsch können
  sie nachgeholt und unter *Medien* hinterlegt werden.
* **Datum der Beiträge.** Die bisherige Seite führte bei „Achtung – Einbrecher" und dem
  Artikel zum Nachbarschaftsrecht kein Veröffentlichungsdatum – beide standen dort als
  Seiteninhalt, nicht als datierter Beitrag (der einzige datierte Eintrag in den
  RSS-Feeds ist ein Webnode-Platzhalter von 2014). Das Feld „Veröffentlicht am" ist
  deshalb **optional**: Beiträge ohne Datum erscheinen ohne Datumsangabe und werden nach
  ihrer letzten Bearbeitung einsortiert. Beide übernommenen Beiträge sind ohne Datum
  gespeichert; ein Datum kann jederzeit nachgetragen werden.
* **Aktuelle Fotos.** Die übernommenen Bilder sind historische Luftbilder. Aktuelle
  Aufnahmen der Anlage fehlen – sie können unter *Medien* hochgeladen und als Titelbild
  der Startseite (*Einstellungen → Titelbild*) oder in Beiträgen verwendet werden.
* **Lageplan.** Die alte Seite zeigte nur eine Überschrift. Ein Parzellenplan kann als
  Bild oder PDF hinterlegt werden.
* **Termine.** Eingetragen sind die Termine 2026 (Spanferkelessen am 20. Juni, Feierabend
  am 18. Juli und 15. August). Neue Termine kommen unter *Termine* dazu.

### Unterschiede zur bisherigen Seite

| | bisher | jetzt |
| --- | --- | --- |
| Technik | Webnode (Baukasten) | eigene Anwendung, Inhalte in eigener Datenbank |
| Mobil | eigene Adresse `m.rehlacke.at` | eine Adresse, Layout passt sich an |
| Tracking | Google Analytics | keines, daher kein Cookie-Banner nötig |
| Pflege | im Baukasten des Anbieters | eigener Redaktionsbereich unter `/admin` |
| Termine | Text auf mehreren Seiten | Terminkalender mit Datum und Uhrzeit |
| Anzeigen | Hinweis ohne Funktion | Formular mit Freigabe durch die Vereinsleitung |
| Kontakt | nur Telefonnummer und E-Mail | zusätzlich Formular mit Eingang im Adminbereich |
