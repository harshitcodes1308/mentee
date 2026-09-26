-- ─── Supabase Schema for MenteeQuiz ─────────────────────────────────────────
-- Run this in your Supabase SQL editor (https://app.supabase.com → SQL Editor)

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists rooms (
  id           text primary key default encode(gen_random_bytes(8), 'hex'),
  code         text unique not null,
  status       text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  current_question_index int not null default 0,
  started_at   timestamptz,
  question_started_at timestamptz,
  host_id      text not null,
  created_at   timestamptz not null default now()
);

create table if not exists players (
  temp_id       text primary key,
  room_id       text not null references rooms(id) on delete cascade,
  nickname      text not null default '',
  avatar_seed   text not null,
  joined_at     timestamptz not null default now(),
  score         int not null default 0,
  streak        int not null default 0,
  best_streak   int not null default 0,
  correct_answers int not null default 0,
  total_time_ms bigint not null default 0
);

create table if not exists answers (
  id            bigserial primary key,
  player_id     text not null references players(temp_id) on delete cascade,
  question_id   int not null,
  selected_index int not null,
  time_taken_ms int not null,
  points_awarded int not null,
  created_at    timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists players_room_id_idx on players(room_id);
create index if not exists answers_player_id_idx on answers(player_id);

-- ─── Row-Level Security (public read/write for demo) ─────────────────────────
-- For production, tighten these policies.

alter table rooms   enable row level security;
alter table players enable row level security;
alter table answers enable row level security;

create policy "public rooms"   on rooms   for all using (true) with check (true);
create policy "public players" on players for all using (true) with check (true);
create policy "public answers" on answers for all using (true) with check (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on these tables in Supabase Dashboard → Database → Replication

-- alter publication supabase_realtime add table rooms;
-- alter publication supabase_realtime add table players;
-- alter publication supabase_realtime add table answers;
