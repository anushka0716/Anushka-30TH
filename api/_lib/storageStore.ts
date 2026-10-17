// Leaderboard stored as small JSON files in Supabase Storage — needs NO SQL setup.
// The bucket is created automatically on first use with the server-side secret key.
import { createHash } from 'node:crypto';
import type { LeaderboardEntry } from '../../src/core/types.js';
import type { InsertOutcome, ResultRow, Store } from './store.js';

const BUCKET = 'quiz-leaderboard';

interface StoredResult extends ResultRow {
  createdAt: string;
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32);

function isDuplicate(status: number, body: string) {
  return status === 409 || /Duplicate|already exists|"409"/i.test(body);
}

export function storageStore(url: string, key: string): Store {
  const base = `${url.replace(/\/+$/, '')}/storage/v1`;
  const auth: Record<string, string> = { apikey: key };
  if (!key.startsWith('sb_')) auth.Authorization = `Bearer ${key}`;
  let bucketReady: Promise<void> | null = null;

  const ensureBucket = () =>
    (bucketReady ??= (async () => {
      const res = await fetch(`${base}/bucket`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
      });
      if (res.ok) return;
      const body = await res.text();
      if (isDuplicate(res.status, body)) return;
      bucketReady = null;
      throw new Error(`Could not create storage bucket (${res.status}): ${body.slice(0, 200)}`);
    })());

  /** Uploads a JSON file. Returns false if it already exists (and overwrite is off). */
  async function put(path: string, data: unknown, overwrite = false): Promise<boolean> {
    await ensureBucket();
    const res = await fetch(`${base}/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json', 'x-upsert': overwrite ? 'true' : 'false' },
      body: JSON.stringify(data),
    });
    if (res.ok) return true;
    const body = await res.text();
    if (!overwrite && isDuplicate(res.status, body)) return false;
    throw new Error(`Storage upload failed (${res.status}): ${body.slice(0, 200)}`);
  }

  async function get<T>(path: string): Promise<T | null> {
    const res = await fetch(`${base}/object/authenticated/${BUCKET}/${path}`, { headers: auth });
    if (!res.ok) return null;
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async function remove(path: string) {
    await fetch(`${base}/object/${BUCKET}`, {
      method: 'DELETE',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: [path] }),
    }).catch(() => {});
  }

  async function listNames(prefix: string): Promise<string[]> {
    await ensureBucket();
    const res = await fetch(`${base}/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`Storage list failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const rows = (await res.json()) as Array<{ name: string; id: string | null }>;
    return rows.filter((r) => r.id && r.name.endsWith('.json')).map((r) => r.name);
  }

  return {
    kind: 'supabase',
    async insert(row): Promise<InsertOutcome> {
      const resultPath = `results/${sha(row.gameId)}/${sha(row.deviceId)}.json`;
      const namePath = `names/${sha(row.gameId)}/${sha(row.nameKey)}.json`;

      // This phone already posted?
      if (await get(resultPath)) return 'duplicate_device';
      // Claim the name (fails if someone else has it).
      const claimed = await put(namePath, { deviceId: row.deviceId });
      if (!claimed) {
        const owner = await get<{ deviceId: string }>(namePath);
        if (owner?.deviceId !== row.deviceId) return 'duplicate_name';
      }
      const stored: StoredResult = { ...row, createdAt: new Date().toISOString() };
      const ok = await put(resultPath, stored);
      if (!ok) {
        if (claimed) await remove(namePath);
        return 'duplicate_device';
      }
      return 'ok';
    },
    async list(gameId, limit = 100): Promise<LeaderboardEntry[]> {
      const prefix = `results/${sha(gameId)}`;
      const names = await listNames(prefix);
      const rows = await Promise.all(names.map((n) => get<StoredResult>(`${prefix}/${n}`)));
      return rows
        .filter((r): r is StoredResult => !!r && r.gameId === gameId)
        .sort((a, b) => b.points - a.points || b.correct - a.correct || a.createdAt.localeCompare(b.createdAt))
        .slice(0, limit)
        .map((r) => ({ name: r.name, points: r.points, correct: r.correct, total: r.total, pct: r.pct, title: r.title, createdAt: r.createdAt }));
    },
  };
}

/** Round-trip check used by /api/health: create bucket, write, list and read a test file. */
export async function storageSelfTest(url: string, key: string): Promise<string> {
  const base = `${url.replace(/\/+$/, '')}/storage/v1`;
  const auth: Record<string, string> = { apikey: key };
  if (!key.startsWith('sb_')) auth.Authorization = `Bearer ${key}`;
  try {
    const b = await fetch(`${base}/bucket`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    });
    const bBody = await b.text();
    if (!b.ok && !isDuplicate(b.status, bBody)) return `bucket error ${b.status}: ${bBody.slice(0, 160)}`;
    const w = await fetch(`${base}/object/${BUCKET}/health/check.json`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json', 'x-upsert': 'true' },
      body: JSON.stringify({ at: new Date().toISOString() }),
    });
    if (!w.ok) return `write error ${w.status}: ${(await w.text()).slice(0, 160)}`;
    const r = await fetch(`${base}/object/authenticated/${BUCKET}/health/check.json`, { headers: auth });
    if (!r.ok) return `read error ${r.status}: ${(await r.text()).slice(0, 160)}`;
    const l = await fetch(`${base}/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: 'health', limit: 10, offset: 0 }),
    });
    if (!l.ok) return `list error ${l.status}: ${(await l.text()).slice(0, 160)}`;
    return 'ok';
  } catch (err) {
    return `could not reach Supabase storage: ${(err as Error).message}`;
  }
}
