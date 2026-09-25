-- ============================================================
-- Impostor-Online · Supabase-Schema + Row Level Security
-- ============================================================
-- Ausführen im Supabase SQL-Editor (Dashboard → SQL → New query).
--
-- Danach im Dashboard aktivieren:
--   1. Authentication → Providers → Anonymous  → Enable
--      (das App-Frontend meldet sich anonym an; Gerät = Spieler-ID)
--   2. Database → Replication → Publication:
--      Tabellen game_state, lobby_players, player_rounds, lobby_messages
--      zur Realtime-Publication hinzufügen
--
-- Sicherheitsmodell:
--   • Das geheime Wort, die Rollenzuordnung und die Impostor-Hilfswörter
--     liegen NUR beim Host und werden nie als Ganzes in die DB geschrieben.
--   • Jeder Spieler erhält ausschließlich seine eigene Zeile in
--     player_rounds – per RLS nur für den eigenen player_id (Auth-UID) lesbar.
--   • Nur der Host darf game_state schreiben; Spieler tragen sich nur
--     selbst in lobby_players ein.

-- ---------- Tabellen ----------

create table if not exists public.game_state (
  id text primary key,
  host_id text not null,
  settings jsonb not null default '{}'::jsonb,
  round_id text,
  updated_at timestamptz not null default now()
);

-- Bestandsspalten ergänzen, falls die Tabelle aus einer älteren Version stammt.
alter table public.game_state add column if not exists host_id text;
alter table public.game_state add column if not exists round_id text;
-- Altlast: Die alte 'round'-Spalte enthielt die Geheimdaten für alle Clients.
-- Nach dem Update kann sie entfernt werden:
-- alter table public.game_state drop column if exists round;

create table if not exists public.lobby_players (
  lobby_code text not null references public.game_state(id) on delete cascade,
  player_id text not null,
  name text not null,
  joined_at timestamptz not null default now(),
  primary key (lobby_code, player_id)
);

create table if not exists public.player_rounds (
  lobby_code text not null,
  player_id text not null,
  round_id text not null,
  payload jsonb not null,
  primary key (lobby_code, player_id, round_id)
);

create table if not exists public.lobby_messages (
  id bigint generated always as identity primary key,
  lobby_code text not null,
  author_id text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lobby_players_code on public.lobby_players (lobby_code);
create index if not exists idx_player_rounds_lookup on public.player_rounds (lobby_code, player_id, round_id);
create index if not exists idx_lobby_messages_lookup on public.lobby_messages (lobby_code, created_at desc);

-- ---------- Row Level Security ----------

alter table public.game_state enable row level security;
alter table public.lobby_players enable row level security;
alter table public.player_rounds enable row level security;
alter table public.lobby_messages enable row level security;

drop policy if exists "game_state_select" on public.game_state;
drop policy if exists "game_state_insert" on public.game_state;
drop policy if exists "game_state_update" on public.game_state;
drop policy if exists "game_state_delete" on public.game_state;
drop policy if exists "lobby_players_select" on public.lobby_players;
drop policy if exists "lobby_players_insert" on public.lobby_players;
drop policy if exists "lobby_players_update" on public.lobby_players;
drop policy if exists "lobby_players_delete" on public.lobby_players;
drop policy if exists "player_rounds_select" on public.player_rounds;
drop policy if exists "player_rounds_insert" on public.player_rounds;
drop policy if exists "player_rounds_update" on public.player_rounds;
drop policy if exists "player_rounds_delete" on public.player_rounds;
drop policy if exists "lobby_messages_select" on public.lobby_messages;
drop policy if exists "lobby_messages_insert" on public.lobby_messages;
drop policy if exists "lobby_messages_delete" on public.lobby_messages;

-- game_state: lesbar für alle (Beitritt braucht Lobby-Info), schreibbar nur durch den Host.
create policy "game_state_select" on public.game_state
  for select using (true);
create policy "game_state_insert" on public.game_state
  for insert with check (auth.uid()::text = host_id);
create policy "game_state_update" on public.game_state
  for update using (auth.uid()::text = host_id);
create policy "game_state_delete" on public.game_state
  for delete using (auth.uid()::text = host_id);

-- lobby_players: lesbar für alle, Spieler tragen nur sich selbst ein,
-- Host darf Spieler entfernen.
create policy "lobby_players_select" on public.lobby_players
  for select using (true);
create policy "lobby_players_insert" on public.lobby_players
  for insert with check (auth.uid()::text = player_id);
create policy "lobby_players_update" on public.lobby_players
  for update using (
    auth.uid()::text = player_id
    or exists (select 1 from public.game_state g where g.id = lobby_code and g.host_id = auth.uid()::text)
  );
create policy "lobby_players_delete" on public.lobby_players
  for delete using (
    auth.uid()::text = player_id
    or exists (select 1 from public.game_state g where g.id = lobby_code and g.host_id = auth.uid()::text)
  );

-- player_rounds: JEDER liest/schreibt NUR die eigene Zeile.
-- Der Host (Runden-Verteiler) darf für die Lobby schreiben/löschen.
create policy "player_rounds_select" on public.player_rounds
  for select using (player_id = auth.uid()::text);
create policy "player_rounds_insert" on public.player_rounds
  for insert with check (
    exists (select 1 from public.game_state g where g.id = lobby_code and g.host_id = auth.uid()::text)
  );
create policy "player_rounds_update" on public.player_rounds
  for update using (player_id = auth.uid()::text);
create policy "player_rounds_delete" on public.player_rounds
  for delete using (
    exists (select 1 from public.game_state g where g.id = lobby_code and g.host_id = auth.uid()::text)
  );

-- lobby_messages: nur Lobby-Mitglieder lesen, nur autorisierte Mitglieder schreiben,
-- nur der Host räumt auf (neue Runde).
create policy "lobby_messages_select" on public.lobby_messages
  for select using (
    exists (select 1 from public.lobby_players p where p.lobby_code = lobby_code and p.player_id = auth.uid()::text)
  );
create policy "lobby_messages_insert" on public.lobby_messages
  for insert with check (
    author_id = auth.uid()::text
    and exists (select 1 from public.lobby_players p where p.lobby_code = lobby_code and p.player_id = auth.uid()::text)
  );
create policy "lobby_messages_delete" on public.lobby_messages
  for delete using (
    exists (select 1 from public.game_state g where g.id = lobby_code and g.host_id = auth.uid()::text)
  );