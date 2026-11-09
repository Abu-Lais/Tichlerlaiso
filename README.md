# HIKMAH · Dein Werkstattkompass

Ein persönlicher Werkstatt- und Lernbegleiter für den Weg durch die Tischlerausbildung. Das Beispielprojekt ist ein Kleidungshalter mit fünf selbst gefertigten Holzhaken. Die Anwendung verbindet einen nächsten überschaubaren Schritt mit dessen Grund, passenden Wissenskarten, Materialdaten und persönlichen Erfahrungen.

## Lokal öffnen

Es ist kein Build und keine Paketinstallation erforderlich. Starte im Projektordner einen statischen Webserver:

```sh
python3 -m http.server 8000
```

Öffne anschließend **http://localhost:8000** im Browser. Ein Doppelklick auf `index.html` genügt wegen der JavaScript-Module nicht. Ein aktueller Browser mit WebGL zeigt die drehbaren Lernmodelle; Three.js und OrbitControls werden in der festgelegten Version **0.180.0** von jsDelivr geladen. Für diese CDN-Dateien wird eine Internetverbindung benötigt. Bei einem 3D-Ladefehler bleiben die übrigen Ansichten benutzbar.

## Benutzung

- **Kompass:** Den nächsten noch offenen Projektschritt aufrufen oder eine Werkstattfrage in eigenen Worten stellen. Der Wissenskompass verbindet vorhandene Lektionen und den tatsächlichen Projektstand; bei fehlendem Wissen bleibt die Frage offen.
- **Mein Projekt:** Den Sinn eines Schritts verstehen, offene Punkte klären und den Lernstand mit Prüfpunkten festhalten. Das Formmodell lässt sich drehen und in Bauteile aufteilen.
- **Maschinen:** Vier schematische Lernmodelle entdecken. Markierte Punkte zeigen Bauteilnamen, Funktion und zugehörige Hinweise. Persönliche Maschinenfotos und Fragen lassen sich als Einträge festhalten.
- **Material & Maße:** Tatsächliche Planmaße in Millimetern sowie abgestimmte Zugaben eintragen, Stückliste berechnen und als CSV exportieren. Vorhandene Bretter mit nutzbaren Maßen, Eignung und Gesamtpreis erfassen und vergleichen.
- **Hikmah:** Eigene Erkenntnisse, Fragen, Merksätze und Fotos sammeln. Grundwissen durchsuchen und hilfreiche Karten merken.

Der große **„Wo war ich?“-Button** hält den aktuellen Kontext und einen selbst formulierten nächsten Handgriff fest. **„Hier weitermachen“** führt an diesen Stand zurück. Die Checklisten dokumentieren den persönlichen Lernstand; sie sind keine maschinelle Freigabe oder fachliche Abnahme.

## Daten und Sicherung

Der persönliche Stand liegt lokal im Browser unter `hikmah:werkstatt:v2`: Projektmaße, Prüfpunkte, Materiallager, Einträge, Fotos, Lesezeichen und gemerkte Ansichten. Ein vorhandener Stand des früheren Prototyps kann übernommen werden. Es gibt keine automatische Synchronisierung zwischen Geräten und kein Benutzerkonto.

Unter **Hikmah → Sicherung exportieren** lässt sich der Stand einschließlich Fotos als JSON-Datei sichern. **Sicherung einlesen** prüft die Datei und fragt vor dem Ersetzen des aktuellen Stands nach. Sichere den bisherigen Stand zuerst, wenn du ihn behalten möchtest. Das Löschen von Browserdaten kann die lokale Speicherung entfernen; eine exportierte Sicherung bleibt unabhängig davon erhalten. Der Export enthält persönliche Fotos und Notizen.

## Berechnungsregeln und Grenzen

- Fertigmaße und Rohmaße stehen in **Länge × Breite × Dicke**, jeweils in Millimetern.
- Jede Zugabe wird **einmal auf das gesamte Maß** addiert: 600 mm Fertiglänge + 20 mm Längenzugabe = 620 mm Rohlänge. Die Zugabe ist keine Empfehlung und muss zum Arbeitsgang passen.
- Die Hakenanzahl beginnt mit fünf; alle unbekannten Planmaße und Zugaben bleiben zunächst leer.
- Der Materialvergleich behandelt jeden Lager-Eintrag als **ein einzelnes Brett** mit einem Gesamtpreis. Er prüft konservativ, ob sämtliche Teile hintereinander in einem Längsstreifen passen, einschließlich angenommener 3-mm-Schnittfugen. Er optimiert keine Zuschnitte, kombiniert keine Bretter und analysiert weder Fehlerstellen noch Faserrichtung oder Holzart.
- Die 3D-Modelle erklären räumliche Zusammenhänge. Sie enthalten keine verlässlichen Einstellskalen eines konkreten Herstellermodells. Maschinenbezogene Werte und Vorgehensweisen stammen aus der passenden Unterweisung und den Herstellerunterlagen.

## Dateien und Schnittstellen

| Datei | Aufgabe |
| --- | --- |
| `index.html`, `style.css` | Zugängliche, responsive Oberfläche und Gestaltung |
| `app.js` | Navigation, Projektführung, Eingaben und Verknüpfung der Bereiche |
| `wissen.js` | `PROJECT_STEPS`, `MACHINES`, `LESSONS`, `KNOWLEDGE_SOURCE` |
| `kalkulation.js` | Reine Funktionen `buildCutList(plan)`, `compareMaterials(materials, cutList)`, `nextAction(state)` |
| `speicher.js` | Lokaler Stand, validierte Sicherungen, Übernahme älterer Daten und Fotos |
| `szene.js` | Three.js-Lernmodelle, Hotspots, Ansichten und Ressourcenfreigabe |
| `mentor.js` | Lokales, nachvollziehbares Wissensrouting über `answerQuestion(query, state)` |
| `manifest.webmanifest`, `sw.js`, `icon.svg` | Installierbare App und Offline-Speicher für Oberfläche und Lernmodelle |
| `projekt_daten.json` | Lesbares Projektmanifest in Schema 2 mit Schritten, Annahmen und Quellen |

Die laufende Oberfläche verwendet die Exporte aus `wissen.js`; `projekt_daten.json` hält denselben Projektweg als lesbares Manifest fest. Bei Änderungen am Projektweg müssen beide konsistent bleiben. Es gibt keine vorgetäuschte KI-Verbindung, automatische Holzbestimmung oder Auswertung eines Papierplans.

## Auf dem Smartphone und ohne Netz

Bei Bereitstellung über HTTPS lässt sich die App über das Browsermenü zum Startbildschirm hinzufügen. Nach dem ersten vollständig geladenen Aufruf werden Oberfläche, Wissen und die Three.js-Module für die Offline-Nutzung gespeichert. Auf localhost funktioniert dies ebenfalls. Neue Geräte benötigen einen ersten Online-Aufruf; Gerätesynchronisierung erfolgt über eine exportierte Sicherung.

Der Fokusknopf im Projekt blendet die Navigation und den Arbeitsweg aus. Der aktuelle Schritt bleibt stehen; „Übersicht zeigen“ bringt die Orientierung zurück. „Wo war ich?“ sichert sofort beim Antippen, auch ohne zusätzliche Rückkehrnotiz.

## Prüfen

Mit Node.js ab Version 20 lassen sich die unabhängigen Tests ohne Installation ausführen:

```sh
npm test
```

Die Tests prüfen Berechnungen, Materialeignung, Wissensverweise, Sicherung/Import, Datenmigration und das lokale Wissensrouting. Die Oberfläche wurde zusätzlich automatisiert in Chromium auf Desktop und Smartphone geprüft, einschließlich Fotos, 3D-Hotspots, Pause/Wiedereinstieg und Offline-Neuladen.

## Fachliche Quellen

Die Inhalte dienen als Grundwissen und werden mit der konkreten Maschine und Unterweisung verbunden:

- [BGHM · Holzbearbeitungsmaschinen](https://www.bghm.de/arbeitsschuetzer/themen/holz/holzbearbeitungsmaschinen)
- [BGHM · Gehrungskappkreissäge](https://www.bghm.de/arbeitsschuetzer/praxishilfen/arbeitsschutz-kompakt/097-gehrungskappkreissaege)
- [BGHM · Arbeiten an Abrichthobelmaschinen](https://www.bghm.de/arbeitsschuetzer/praxishilfen/arbeitsschutz-kompakt/034-arbeiten-an-abrichthobelmaschinen/)
- [BGHM · Arbeiten an Dickenhobelmaschinen](https://www.bghm.de/arbeitsschuetzer/praxishilfen/arbeitsschutz-kompakt/041-arbeiten-an-dickenhobelmaschinen/)
- [BGHM · Maschinen](https://www.bghm.de/arbeitsschuetzer/themen/maschinen)
