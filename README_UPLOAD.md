# Wissenszeit PWA v0.3

Diese Version ersetzt die bisherige v0.2 auf GitHub Pages.

## Neu
- `Unnuetzes Wissen` ist jetzt ein fest eingebautes Standard-Lernpaket der PWA.
- Das Paket wird beim ersten Start automatisch mitgeladen und steht danach offline zur Verfuegung.
- Ein bisher manuell importiertes `Unnuetzes Wissen` mit derselben Paket-ID wird bei gleicher oder aelterer Version durch die zentral bereitgestellte Version ersetzt.
- Lernfortschritt und Aktiv/Deaktiviert-Status bleiben dabei erhalten, weil diese Daten getrennt vom Inhalt gespeichert werden.
- Standard-Lernpakete werden online bevorzugt aktualisiert und fallen offline auf den lokalen Cache zurueck.
- Der gefuehrte Lernmodus aus v0.2 bleibt unveraendert erhalten.

## Enthaltene Standard-Lernpakete
- Allgemeinwissen Basis: 41 Inhalte
- Unnuetzes Wissen: 18 Inhalte

Damit stehen nach dem ersten Laden insgesamt 59 Inhalte ohne manuellen Import bereit.

## Upload auf GitHub Pages
1. ZIP entpacken.
2. Im GitHub-Repository `wissenszeit` die Dateien im Root ersetzen/hochladen.
3. `README.md` darf bestehen bleiben; wichtig ist, dass `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `icons/` und `assets/` direkt im Repository-Root liegen.
4. Commit erstellen, z. B. `Wissenszeit PWA v0.3`.
5. Nach dem GitHub-Pages-Deployment die PWA einmal online oeffnen bzw. aktualisieren und anschliessend komplett schliessen und erneut vom Home-Bildschirm starten.

## Daten
Name, Lernfortschritt, importierte Zusatzpakete, Paketaktivierungen und Einstellungen liegen weiterhin lokal unter derselben GitHub-Pages-Adresse. Das Update loescht diese Daten nicht.

`Unnuetzes Wissen` darf weiterhin im Bereich `Pakete` deaktiviert werden. Die Deaktivierung bleibt auch nach spaeteren zentralen Inhaltsupdates erhalten.
