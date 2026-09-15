# Wissenszeit PWA v0.2

Diese Version ersetzt die bisherige v0.1 auf GitHub Pages.

## Neu
- 5-Minuten-Einheiten laufen jetzt in 4 gefuehrten Schritten: Verstehen, Vertiefen, Pruefen, Erinnern.
- 20-Minuten-Einheiten laufen in 9 Schritten: Orientierung, Vorwissen, Fundament, Zusammenhang, Beispiel, Perspektive, Wissens-Check, Transfer, Abschluss.
- Feste Zurueck-/Weiter-Navigation am unteren Rand.
- Fortschrittsanzeige innerhalb der Einheit.
- Der aktuelle Schritt wird lokal gespeichert. Eine unterbrochene Einheit wird an derselben Stelle fortgesetzt.
- Quizantworten und bestehender Lernfortschritt bleiben wie bisher lokal gespeichert.
- Aktualisierte Offline-Strategie: App-Shell wird online bevorzugt aktualisiert und bleibt offline verfuegbar.

## Upload auf GitHub Pages
1. ZIP entpacken.
2. Im GitHub-Repository `wissenszeit` die Dateien im Root ersetzen/hochladen.
3. `README.md` darf bestehen bleiben; wichtig ist, dass `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `icons/` und `assets/` direkt im Repository-Root liegen.
4. Commit erstellen, z. B. `Wissenszeit PWA v0.2`.
5. Nach dem GitHub-Pages-Deployment die PWA einmal online oeffnen bzw. aktualisieren und anschliessend komplett schliessen und erneut vom Home-Bildschirm starten.

## Daten
Der Name, Lernfortschritt, importierte Lernpakete, Paketaktivierungen und Einstellungen liegen unter derselben GitHub-Pages-Adresse weiterhin im lokalen Browser-/PWA-Speicher. Ein Update der Dateien loescht diese Daten nicht.
