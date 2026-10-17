-- Anushka Turns 30 — shared leaderboard table.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

create table if not exists public.quiz_results (
  id          bigint generated always as identity primary key,
  game_id     text        not null check (char_length(game_id) between 1 and 64),
  device_id   uuid        not null,
  name        text        not null check (char_length(name) between 1 and 24),
  name_key    text        not null,
  points      integer     not null check (points >= 0),
  correct     integer     not null check (correct >= 0),
  total       integer     not null check (total > 0),
  pct         numeric(5,1) not null check (pct between 0 and 100),
  title       text        not null,
  categories  jsonb,
  created_at  timestamptz not null default now(),

  constraint quiz_results_correct_le_total check (correct <= total),

  -- One score per phone per game, and no two players with the same name.
  constraint quiz_results_one_per_device unique (game_id, device_id),
  constraint quiz_results_unique_name    unique (game_id, name_key)
);

create index if not exists quiz_results_board_idx
  on public.quiz_results (game_id, points desc, correct desc, created_at);

-- Lock the table down. With RLS on and NO policies, the public "anon" key can't read or
-- write anything. Only the server functions (using the secret / service-role key) can.
alter table public.quiz_results enable row level security;

-- ── Handy admin snippets (run manually when needed) ──────────────────────
-- See everything:          select name, points, correct, total, created_at from quiz_results where game_id = 'anushka-30' order by points desc;
-- Remove one entry:        delete from quiz_results where game_id = 'anushka-30' and name = 'Test';
-- Wipe the board (tests):  delete from quiz_results where game_id = 'anushka-30';
