// api/room-create.ts — POST → create a new room
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function generateId(): string {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL!);
  const hostId = generateId();
  const code   = generateCode();

  // Retry if code collision (extremely rare)
  let room: { id: string; code: string } | null = null;
  for (let i = 0; i < 3; i++) {
    try {
      const rows = await sql`
        INSERT INTO rooms (code, host_id)
        VALUES (${code}, ${hostId})
        RETURNING id, code, host_id, status, current_question_index, started_at, question_started_at
      `;
      room = rows[0] as { id: string; code: string };
      break;
    } catch { /* collision — retry */ }
  }

  if (!room) return res.status(500).json({ error: 'Failed to create room' });

  return res.status(200).json({ room, hostId });
}
