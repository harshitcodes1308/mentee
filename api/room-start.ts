// api/room-start.ts — POST → host starts the quiz
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, hostId } = req.body as { code: string; hostId: string };
  if (!code || !hostId) return res.status(400).json({ error: 'code and hostId required' });

  const sql = neon(process.env.DATABASE_URL!);

  const now = new Date().toISOString();
  const result = await sql`
    UPDATE rooms SET
      status = 'playing',
      started_at = ${now},
      current_question_index = 0,
      question_started_at = ${now}
    WHERE code = ${code.toUpperCase()} AND host_id = ${hostId} AND status = 'waiting'
    RETURNING id
  `;

  if (!result.length) return res.status(403).json({ error: 'Not authorized or room not in waiting state' });

  return res.status(200).json({ ok: true, questionStartedAt: now });
}
