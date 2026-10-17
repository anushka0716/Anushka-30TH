import type { LeaderboardEntry } from '../../src/core/types.js';
import { storageStore } from './storageStore.js';

export interface ResultRow {
  gameId: string;
  deviceId: string;
  name: string;
  nameKey: string;
  points: number;
  correct: number;
  total: number;
  pct: number;
  title: string;
  categories: unknown;
}

export type InsertOutcome = 'ok' | 'duplicate_device' | 'duplicate_name';

export interface Store {
  kind: 'supabase' | 'memory';
  insert(row: ResultRow): Promise<InsertOutcome>;
  list(gameId: string, limit?: number): Promise<LeaderboardEntry[]>;
}

const TABLE = 'quiz_results';

/**
 * Supabase via its REST API (PostgREST) using plain fetch — no SDK needed.
 * Uses the SERVICE ROLE / SECRET key, which only ever lives in server env vars.
 */
export function supabaseStore(url: string, key: string): Store {
  const base = `${url.replace(/\/+$/, '')}/rest/v1/${TABLE}`;
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  // Legacy JWT keys also go in Authorization; new "sb_secret_…" keys must only be sent as apikey.
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`;

  return {
    kind: 'supabase',
    async insert(row) {
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          game_id: row.gameId,
          device_id: row.deviceId,
          name: row.name,
          name_key: row.nameKey,
          points: row.points,
          correct: row.correct,
          total: row.total,
          pct: row.pct,
          title: row.title,
          categories: row.categories,
        }),
      });
      if (res.ok) return 'ok';
      const text = await res.text();
      if (res.status === 409 || text.includes('23505')) {
        return text.includes('quiz_results_unique_name') ? 'duplicate_name' : 'duplicate_device';
      }
      throw new Error(`Supabase insert failed (${res.status}): ${text.slice(0, 300)}`);
    },
    async list(gameId, limit = 100) {
      const q = new URLSearchParams({
        select: 'name,points,correct,total,pct,title,created_at',
        game_id: `eq.${gameId}`,
        order: 'points.desc,correct.desc,created_at.asc',
        limit: String(limit),
      });
      const res = await fetch(`${base}?${q}`, { headers });
      if (!res.ok) throw new Error(`Supabase read failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      const rows = (await res.json()) as Array<Record<string, unknown>>;
      return rows.map((r) => ({
        name: String(r.name),
        points: Number(r.points),
        correct: Number(r.correct),
        total: Number(r.total),
        pct: Number(r.pct),
        title: String(r.title),
        createdAt: String(r.created_at),
      }));
    },
  };
}

/** In-memory store for local development only (`npm run dev`). Resets when the server restarts. */
// Kept on globalThis so it survives Vite reloading this module during development.
const g = globalThis as unknown as { __a30Rows?: (ResultRow & { createdAt: string })[] };
const memoryRows = (g.__a30Rows ??= []);
const memoryStore: Store = {
  kind: 'memory',
  async insert(row) {
    if (memoryRows.some((r) => r.gameId === row.gameId && r.deviceId === row.deviceId)) return 'duplicate_device';
    if (memoryRows.some((r) => r.gameId === row.gameId && r.nameKey === row.nameKey)) return 'duplicate_name';
    memoryRows.push({ ...row, createdAt: new Date().toISOString() });
    return 'ok';
  },
  async list(gameId, limit = 100) {
    return memoryRows
      .filter((r) => r.gameId === gameId)
      .sort((a, b) => b.points - a.points || b.correct - a.correct || a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
      .map((r) => ({ name: r.name, points: r.points, correct: r.correct, total: r.total, pct: r.pct, title: r.title, createdAt: r.createdAt }));
  },
};

/** Returns the configured store, or null when the shared leaderboard isn't set up (solo mode). */
export function getStore(): Store | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  // Scores live in Supabase Storage (auto-created, no SQL needed). supabaseStore() is the
  // table-based alternative if you ever prefer to run supabase/schema.sql.
  if (url && key) return storageStore(url, key);
  // On Vercel without credentials: no shared leaderboard. Locally: fake it in memory.
  if (process.env.VERCEL) return null;
  return memoryStore;
}
