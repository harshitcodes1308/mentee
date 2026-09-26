// ─── Neon (Serverless Postgres) Client ───────────────────────────────────────
// Set VITE_DATABASE_URL in .env.local from your Neon project dashboard.
// The app works in Demo Mode (BroadcastChannel) without any credentials.

import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL as string;

export const IS_DEMO_MODE = !connectionString;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let sql: any = null;

if (!IS_DEMO_MODE) {
  try {
    sql = neon(connectionString);
  } catch {
    console.warn('[Neon] Failed to initialise — running in Demo Mode');
  }
}

// ─── Neon helpers (used when not in demo mode) ────────────────────────────────

export async function neonQuery<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  if (!sql) return [];
  try {
    return await sql(query, ...values) as T[];
  } catch (err) {
    console.error('[Neon] query error:', err);
    return [];
  }
}
