// ─── Initialize Neon DB Schema ───────────────────────────────────────────────
// Run: node --env-file=.env.local scripts/setup-db.mjs

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log('🔌 Connecting to Neon…');

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  console.log('✅ pgcrypto extension enabled');

  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      code             TEXT UNIQUE NOT NULL,
      status           TEXT NOT NULL DEFAULT 'waiting'
                         CHECK (status IN ('waiting','playing','finished')),
      current_question_index INT NOT NULL DEFAULT 0,
      started_at       TIMESTAMPTZ,
      question_started_at TIMESTAMPTZ,
      host_id          TEXT NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log('✅ rooms table');

  await sql`
    CREATE TABLE IF NOT EXISTS players (
      temp_id          TEXT PRIMARY KEY,
      room_id          TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      nickname         TEXT NOT NULL DEFAULT '',
      avatar_seed      TEXT NOT NULL,
      joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      score            INT NOT NULL DEFAULT 0,
      streak           INT NOT NULL DEFAULT 0,
      best_streak      INT NOT NULL DEFAULT 0,
      correct_answers  INT NOT NULL DEFAULT 0,
      total_time_ms    BIGINT NOT NULL DEFAULT 0
    )
  `;
  console.log('✅ players table');

  await sql`
    CREATE TABLE IF NOT EXISTS answers (
      id               BIGSERIAL PRIMARY KEY,
      player_id        TEXT NOT NULL REFERENCES players(temp_id) ON DELETE CASCADE,
      question_id      INT NOT NULL,
      selected_index   INT NOT NULL,
      time_taken_ms    INT NOT NULL,
      points_awarded   INT NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(player_id, question_id)
    )
  `;
  console.log('✅ answers table');

  await sql`CREATE INDEX IF NOT EXISTS players_room_id_idx ON players(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS answers_player_id_idx ON answers(player_id)`;
  console.log('✅ indexes');

  console.log('\n🎉 Database ready!');
  process.exit(0);
}

setup().catch((e) => { console.error('❌', e.message); process.exit(1); });
