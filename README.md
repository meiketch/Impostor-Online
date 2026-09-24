# Impostor Game – GitHub Pages Version

Dies ist die statische Web-Version des Impostor-Spiels. Die Spiel-Logik wurde aus der Android-Version portiert, aber die Wörter und Hilfswörter liegen in einer JSON-Datei vor.

## Features

- Offline nutzbar
- GitHub-Pages kompatibel
- Rollenverteilung mit Impostor, Jester, Detektiv und Doppelgänger
- Wörter/Hilfswörter in `data/words.json`
- Optionaler Supabase-Status für Spielstände

## Struktur

- `index.html` – Hauptseite
- `styles.css` – Styling
- `app.js` – Spiel-Logik
- `data/words.json` – Wortliste inkl. Hilfswörter
- `supabase-config.example.js` – Supabase-Konfiguration (optional)
- `sw.js` – Service Worker für Offline-Cache
- `manifest.webmanifest` – PWA-Manifest

## GitHub Pages

1. Dieses Repository auf GitHub hochladen.
2. In den Repository-Einstellungen auf GitHub Pages gehen.
3. Branch `main` und Ordner `/root` auswählen.
4. Seite veröffentlichen.

## Supabase (optional)

1. `supabase-config.example.js` nach `supabase-config.js` kopieren.
2. Deine Supabase-URL und deinen Anon-Key eintragen.
3. In Supabase eine Tabelle `game_state` anlegen mit einer Zeile `id` als Text/UUID und den Spalten `players`, `settings`, `round`, `updated_at`.
4. Wenn keine Konfiguration gesetzt ist, funktioniert die App nur lokal mit localStorage.

### Multiplayer-Lobbys

Für die Verbindung mehrerer Browser muss die Tabelle `game_state` mindestens diese Spalten besitzen:

```sql
create table if not exists game_state (
	id text primary key,
	players jsonb not null default '[]'::jsonb,
	settings jsonb not null default '{}'::jsonb,
	round jsonb,
	updated_at timestamptz not null default now()
);

create table if not exists public.lobby_players (
	lobby_code text not null references public.game_state(id) on delete cascade,
	player_id text not null,
	name text not null,
	created_at timestamptz not null default now(),
	primary key (lobby_code, player_id)
);

alter table public.lobby_players enable row level security;

alter table public.game_state enable row level security;

create policy "Public can read game state"
on public.game_state for select to anon using (true);

create policy "Public can create game state"
on public.game_state for insert to anon with check (true);

create policy "Public can update game state"
on public.game_state for update to anon using (true) with check (true);

create policy "Public can read lobby players"
on public.lobby_players for select to anon using (true);

create policy "Public can join lobbies"
on public.lobby_players for insert to anon with check (true);

create policy "Public can remove lobby players"
on public.lobby_players for delete to anon using (true);
```

Aktiviere anschließend beide Tabellen unter **Database > Publications > supabase_realtime**. Jeder Lobby-Code ist eine eigene `game_state`-Zeile, jeder Spieler eine eigene `lobby_players`-Zeile. Der Host startet die Runde; jeder Browser sieht danach ausschließlich sein eigenes Spielpanel.

Die Lobby-Einstellungen werden allen Spielern angezeigt. Nur der Host kann sie ändern und die Runde starten. Nach dem Start sieht jeder Spieler das gesuchte Wort und die Detektiv-Items; die Detektivnachricht wird ausschließlich im Panel des Detektivs angezeigt.

## Hinweis

Die App ist bewusst leicht und statisch gehalten, damit sie problemlos auf GitHub Pages gehostet werden kann.
