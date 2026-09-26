// api/room-join.ts — POST → player joins room
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, tempId, nickname, avatarSeed } = req.body as {
    code: string; tempId: string; nickname: string; avatarSeed: string;
  };
  if (!code || !tempId || !avatarSeed) return res.status(400).json({ error: 'code, tempId, avatarSeed required' });

  const sql = neon(process.env.DATABASE_URL!);

  const rooms = await sql`SELECT id, status FROM rooms WHERE code = ${code.toUpperCase()}`;
  if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
  const room = rooms[0];
  if (room.status === 'finished') return res.status(400).json({ error: 'Room already finished' });

  // Upsert — safe for reconnects with same tempId
  await sql`
    INSERT INTO players (temp_id, room_id, nickname, avatar_seed)
    VALUES (${tempId}, ${room.id}, ${nickname || `Hacker ${tempId.slice(-4)}`}, ${avatarSeed})
    ON CONFLICT (temp_id) DO UPDATE SET nickname = EXCLUDED.nickname
  `;

  return res.status(200).json({ ok: true, roomId: room.id });
}
