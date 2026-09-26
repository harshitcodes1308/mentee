// ─── Utilities ────────────────────────────────────────────────────────────────

export function getAvatarUrl(seed: string): string {
  const styles = ['adventurer', 'lorelei', 'bottts', 'fun-emoji', 'avataaars'];
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const style = styles[hash % styles.length];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generateTempId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${ts}-${rnd}`;
}

export function getSecondsRemaining(startedAt: string, totalSec: number): number {
  return Math.max(0, totalSec - (Date.now() - new Date(startedAt).getTime()) / 1000);
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Answer button letter labels (used by host + player screens)
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
