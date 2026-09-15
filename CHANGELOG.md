# Changelog

## v0.3
- `Unnuetzes Wissen` als zweites fest eingebautes Standard-Lernpaket integriert.
- 18 Inhalte direkt mit der PWA ausgeliefert, inklusive 5 Spezialwissen-Einheiten.
- Beide Standardpakete werden durch den Service Worker fuer Offline-Nutzung vorgehalten.
- Zentrale Standardpakete erhalten bei gleicher oder neuerer Version Vorrang vor einem frueher manuell importierten Exemplar derselben Paket-ID.
- Paketaktivierung und Lernfortschritt bleiben bei solchen Inhaltsupdates erhalten.
- Standard-Lerninhalte werden online bevorzugt aktualisiert und offline aus dem Cache geladen.

## v0.2
- Gefuehrter Step-by-Step-Lernmodus fuer 5- und 20-Minuten-Einheiten.
- 4 Schritte fuer Microlearning, 9 Schritte fuer Deep Dives.
- Fortschrittsbalken und Schrittzaehler in der Lerneinheit.
- Persistenter aktueller Lektionsschritt pro Lektion.
- Neue feste Zurueck-/Weiter-Navigation.
- Aktiver Abruf und Quiz als eigene Lernschritte statt einer langen Scrollseite.
- Network-first fuer App-Shell-Dateien, Cache-first fuer sonstige statische Inhalte; Offline-Funktion bleibt erhalten.
