// api/room-next.ts — POST → host advances to next question (or finishes)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const TOTAL_QUESTIONS = 20;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, hostId } = req.body as { code: string; hostId: string };
  if (!code || !hostId) return res.status(400).json({ error: 'code and hostId required' });

  const sql = neon(process.env.DATABASE_URL!);

  const rooms = await sql`
    SELECT id, current_question_index, status, host_id
    FROM rooms WHERE code = ${code.toUpperCase()}
  `;
  if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
  const room = rooms[0];
  if (room.host_id !== hostId) return res.status(403).json({ error: 'Not authorized' });
  if (room.status !== 'playing') return res.status(400).json({ error: 'Room not playing' });

  const nextIdx = room.current_question_index + 1;
  const now = new Date().toISOString();

  if (nextIdx >= TOTAL_QUESTIONS) {
    // End quiz
    await sql`
      UPDATE rooms SET status = 'finished', question_started_at = NULL
      WHERE id = ${room.id}
    `;
    return res.status(200).json({ ok: true, status: 'finished' });
  }

  // Advance to next question
  await sql`
    UPDATE rooms SET
      current_question_index = ${nextIdx},
      question_started_at = ${now}
    WHERE id = ${room.id}
  `;

  return res.status(200).json({ ok: true, questionIndex: nextIdx, questionStartedAt: now });
}
