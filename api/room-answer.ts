// api/room-answer.ts — POST → player submits an answer (server scores it)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const QUESTIONS_CORRECT_IDX = [0,1,2,2,1,3,1,2,0,1,0,2,1,1,1,1,2,1,1,2];
const QUESTION_TIME_SEC = 15;

function calcPoints(correct: boolean, timeTakenMs: number, streak: number): number {
  if (!correct) return 0;
  const speedBonus = Math.round(500 * Math.max(0, 1 - timeTakenMs / (QUESTION_TIME_SEC * 1000)));
  const streakBonus = streak >= 2 ? 100 * Math.min(streak - 1, 5) : 0;
  return 1000 + speedBonus + streakBonus;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, tempId, questionId, selectedIndex } = req.body as {
    code: string; tempId: string; questionId: number; selectedIndex: number;
  };
  if (!code || !tempId || questionId == null || selectedIndex == null) {
    return res.status(400).json({ error: 'code, tempId, questionId, selectedIndex required' });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Get room + question timing
  const rooms = await sql`
    SELECT id, current_question_index, question_started_at, status
    FROM rooms WHERE code = ${code.toUpperCase()}
  `;
  if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
  const room = rooms[0];
  if (room.status !== 'playing') return res.status(400).json({ error: 'Room not playing' });

  // Server-computed timing (prevents client cheating)
  const startedAt = new Date(room.question_started_at).getTime();
  const timeTakenMs = Math.min(Date.now() - startedAt, QUESTION_TIME_SEC * 1000);

  // Correct answer check
  const qIdx = room.current_question_index;
  const correct = selectedIndex === QUESTIONS_CORRECT_IDX[qIdx];

  // Get current player streak
  const players = await sql`
    SELECT streak FROM players WHERE temp_id = ${tempId}
  `;
  if (!players.length) return res.status(404).json({ error: 'Player not found' });
  const currentStreak = players[0].streak as number;

  const newStreak = correct ? currentStreak + 1 : 0;
  const points = calcPoints(correct, timeTakenMs, newStreak);

  // Record answer (ignore duplicate — idempotent)
  try {
    await sql`
      INSERT INTO answers (player_id, question_id, selected_index, time_taken_ms, points_awarded)
      VALUES (${tempId}, ${questionId}, ${selectedIndex}, ${timeTakenMs}, ${points})
      ON CONFLICT (player_id, question_id) DO NOTHING
    `;
  } catch { /* already answered — ignore */ }

  // Update player score
  await sql`
    UPDATE players SET
      score          = score + ${points},
      streak         = ${newStreak},
      best_streak    = GREATEST(best_streak, ${newStreak}),
      correct_answers = correct_answers + ${correct ? 1 : 0},
      total_time_ms  = total_time_ms + ${timeTakenMs}
    WHERE temp_id = ${tempId}
  `;

  return res.status(200).json({ ok: true, correct, points, timeTakenMs });
}
