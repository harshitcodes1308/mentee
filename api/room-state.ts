// api/room-state.ts — GET ?code=XXXX → full room snapshot
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  // Prevent caching — clients need fresh data on every poll
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')  return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.query;
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'code required' });

  const sql = neon(process.env.DATABASE_URL!);

  const rooms = await sql`
    SELECT id, code, status, current_question_index, started_at, question_started_at, host_id
    FROM rooms WHERE code = ${code.toUpperCase()}
  `;
  if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
  const room = rooms[0];

  const players = await sql`
    SELECT temp_id, nickname, avatar_seed, score, streak, best_streak, correct_answers, total_time_ms, joined_at
    FROM players WHERE room_id = ${room.id}
    ORDER BY score DESC, correct_answers DESC, total_time_ms ASC
  `;

  return res.status(200).json({
    room: {
      id: room.id,
      code: room.code,
      status: room.status,
      currentQuestionIndex: room.current_question_index,
      startedAt: room.started_at,
      questionStartedAt: room.question_started_at,
      hostId: room.host_id,
    },
    players: players.map((p: Record<string, unknown>) => ({
      tempId: p.temp_id,
      roomId: room.id,
      nickname: p.nickname,
      avatarSeed: p.avatar_seed,
      score: p.score,
      streak: p.streak,
      bestStreak: p.best_streak,
      correctAnswers: p.correct_answers,
      totalTimeMs: p.total_time_ms,
      joinedAt: p.joined_at,
    })),
  });
}
