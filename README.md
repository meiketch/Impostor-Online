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

## Supabase einrichten (Multiplayer)

Die Spielerliste, Lobby-Einstellungen und die Rollenverteilung laufen über ein Supabase-Projekt.
So richtest du es ein:

1. **Schema + Row Level Security anwenden:** `supabase/schema.sql` im Supabase SQL-Editor ausführen (Dashboard → SQL → New query).
2. **Anonymous Sign-In aktivieren:** Authentication → Providers → **Anonymous** → Enable. Das Frontend meldet sich anonym an – ein Gerät entspricht einem Spieler.
3. **Realtime aktivieren:** Database → Replication → Publication: die Tabellen `game_state`, `lobby_players`, `player_rounds`, `lobby_messages` hinzufügen.
4. `supabase-config.js` mit deiner Projekt-URL und dem anon key befüllen (oder `supabase-config.example.js` kopieren).

### Sicherheit: Rollen-Geheimnis

Seit dem Refactor werden **keine geheimen Spieldaten mehr an alle Clients verteilt**:

- Das geheime Wort, die vollständige Rollenzuordnung und die Impostor-Hilfswörter liegen **nur beim Host** und werden nie als Ganzes synchronisiert.
- Jeder Spieler erhält ausschließlich **seine eigene Rolle** (Tabelle `player_rounds`, per RLS nur für die eigene Auth-UID lesbar).
- Nur der Host darf `game_state` schreiben; Spieler tragen sich nur selbst in `lobby_players` ein.
- Detektiv-Nachrichten laufen über `lobby_messages` (nur Lobby-Mitglieder). Die Rot/Schwarz-Anzeige bleibt bewusst rein clientseitig.

Grenze: Eine statische GitHub-Pages-Seite kann einen technisch versierten Mitspieler, der aktiv nach Geheimnissen sucht, nicht hundertprozentig aussperren – dafür bräuchte es serverseitige Logik (z. B. Supabase Edge Functions). Der Standardweg (eigene Rolle sehen, andere Rollen nicht) ist jetzt abgesichert.

### Ohne Supabase

Ohne gültige `supabase-config.js` läuft das Spiel weiterhin komplett **lokal im Browser** (eine Runde auf einem Gerät, Sync über localStorage-Tabs).
