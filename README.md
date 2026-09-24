# Impostor Game – GitHub Pages Version

Dies ist die statische Web-Version des Impostor-Spiels. Die Spiel-Logik wurde aus der Android-Version portiert, aber die Wörter und Hilfswörter liegen in einer JSON-Datei vor.

## Anwendung öffnen

Die veröffentlichte Anwendung findest du hier:

https://meiketch.github.io/Impostor-Online/

Falls die Seite nach einem Update noch die alte Version zeigt, lade sie mit `Strg+F5` neu.

## Spielen

### Lobby erstellen

1. Öffne die Anwendung.
2. Gib deinen Namen ein.
3. Klicke auf **Lobby erstellen**.
4. Teile den angezeigten Lobby-Code mit den anderen Spielern.

Der Ersteller ist automatisch der Host. Nur der Host kann die Lobby-Einstellungen ändern und die Runde starten.

### Einer Lobby beitreten

1. Öffne die Anwendung auf deinem Gerät.
2. Gib deinen Namen ein.
3. Gib den fünfstelligen Lobby-Code ein.
4. Klicke auf **Beitreten**.

Alle Spieler müssen denselben Lobby-Code verwenden. Die Spielerliste wird aus Supabase geladen, damit gekickte oder alte Spieler nicht erneut erscheinen.

### Runde starten

Der Host kann folgende Einstellungen ändern:

- Anzahl der Impostoren
- Jester
- Detektive
- Items pro Detektiv
- Doppelgänger
- Wahrscheinlichkeiten und Zufallsoptionen der Zusatzrollen

Mit **Runde starten** werden die Rollen verteilt. Jeder Spieler sieht danach nur seine eigene Rolle im rechten Spielpanel.

## Designs

Oben rechts kann zwischen mehreren Designs gewechselt werden:

- Neon Night
- Classic Space
- CRT Terminal
- Windows 95 BSOD
- Corkboard Case File

Die Auswahl wird lokal im Browser gespeichert.
