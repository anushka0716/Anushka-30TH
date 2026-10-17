// GET /api/health — setup diagnostics. Reports WHETHER settings look right, never their values.
import { config } from '../src/data/config.js';
import { json } from './_lib/http.js';
import { storageSelfTest } from './_lib/storageStore.js';

export async function GET(): Promise<Response> {
  const url = (process.env.SUPABASE_URL ?? '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  const similarNames = Object.keys(process.env).filter((k) => /SUPABASE/i.test(k));

  const report: Record<string, unknown> = {
    gameId: config.gameId,
    supabaseUrlSet: !!url,
    supabaseUrlLooksRight: /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url),
    serviceKeySet: !!key,
    serviceKeyType: !key
      ? 'missing'
      : key.startsWith('sb_secret_')
        ? 'secret (correct)'
        : key.startsWith('sb_publishable_')
          ? 'PUBLISHABLE (wrong key — use the secret one)'
          : key.startsWith('eyJ')
            ? 'legacy JWT (anon or service_role)'
            : 'unrecognised',
    supabaseVariableNamesFound: similarNames,
    vercelEnv: process.env.VERCEL_ENV ?? 'local',
  };

  if (url && key) {
    report.storageCheck = await storageSelfTest(url, key);
    const headers: Record<string, string> = { apikey: key };
    if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`;
    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/quiz_results?select=id&limit=1`, { headers });
      const body = await res.text();
      report.tableCheckOptional = res.ok
        ? 'ok'
        : res.status === 401 || res.status === 403
          ? `key rejected (${res.status})`
          : body.includes('42P01') || body.includes('PGRST205') || res.status === 404
            ? 'table quiz_results not found — run supabase/schema.sql'
            : `error ${res.status}: ${body.slice(0, 160)}`;
    } catch (err) {
      report.tableCheckOptional = `could not reach Supabase: ${(err as Error).message}`;
    }
  } else {
    report.storageCheck = 'skipped — settings missing';
  }

  return json(report, 200);
}
