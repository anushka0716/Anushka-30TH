import type { AnswerRecord, LeaderboardEntry } from '../core/types';

export type SubmitResult =
  | { status: 'saved' }
  | { status: 'duplicate_device' }
  | { status: 'duplicate_name'; message: string }
  | { status: 'not_configured' }
  | { status: 'error'; message: string };

export async function submitScore(payload: { deviceId: string; name: string; answers: AnswerRecord[] }): Promise<SubmitResult> {
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) return { status: 'saved' };
    if (data.code === 'duplicate_device') return { status: 'duplicate_device' };
    if (data.code === 'duplicate_name') return { status: 'duplicate_name', message: data.error };
    if (res.status === 503 || res.status === 404) return { status: 'not_configured' };
    return { status: 'error', message: data.error || 'Could not save your score.' };
  } catch {
    return { status: 'error', message: 'No connection. Your score is saved on this phone — try again.' };
  }
}

export type BoardResult =
  | { status: 'ok'; entries: LeaderboardEntry[] }
  | { status: 'not_configured' }
  | { status: 'error' };

export async function fetchLeaderboard(): Promise<BoardResult> {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    if (res.status === 503 || res.status === 404) return { status: 'not_configured' };
    const data = await res.json();
    if (!res.ok) return { status: 'error' };
    return { status: 'ok', entries: data.entries ?? [] };
  } catch {
    return { status: 'error' };
  }
}
