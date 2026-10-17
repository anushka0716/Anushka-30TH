import { describe, expect, it } from 'vitest';
import { config } from '../src/data/config';
import { activeRounds, allQuestions, playableQuestions, questionsById, validateBank } from '../src/core/bank';
import { buildPlan, shuffle } from '../src/core/shuffle';
import { scoreAnswer, scoreRun, titleFor } from '../src/core/scoring';
import * as game from '../src/core/game';
import { parseSubmission } from '../api/_lib/submission';
import { POST as submit } from '../api/submit';
import { GET as leaderboard } from '../api/leaderboard';
import type { AnswerRecord, QuizConfig } from '../src/core/types';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe('question bank', () => {
  it('is valid', () => {
    expect(validateBank()).toEqual([]);
  });
  it('has the required personal facts with the right answers', () => {
    const ans = (id: string) => {
      const q = questionsById.get(id)!;
      return q.options.find((o) => o.id === q.correctId)!.text;
    };
    expect(ans('p01')).toBe('Passionfruit caipiroska');
    expect(ans('p02')).toBe('4 February 2020');
    expect(ans('p03')).toBe('19 December 2018');
    expect(ans('p04')).toBe('Paula');
    expect(ans('p05')).toBe('Auburn');
    expect(ans('p06')).toBe('Nissan Terrano');
    expect(ans('p07')).toBe('[re] refuge — home away from home');
    expect(ans('p08')).toBe('Overthinking a simple decision');
    expect(ans('p09')).toBe('A remote wellness retreat');
    expect(ans('p10')).toContain('Let’s keep it low-key');
    expect(ans('p11')).toBe('Become a wellness girlie');
  });
  it('has 20 trivia questions, mostly hard, with rotated answers', () => {
    const t = allQuestions.filter((q) => q.round === 'trivia');
    expect(t).toHaveLength(20);
    expect(t.filter((q) => q.difficulty === 'hard').length).toBeGreaterThan(10);
    const letters = new Set(t.map((q) => q.correctId));
    expect(letters).toEqual(new Set(['a', 'b', 'c', 'd']));
  });
  it('plays all three rounds in order, and hides a round with no questions', () => {
    expect(activeRounds.map((r) => r.id)).toEqual(['anushka', 'trivia', 'friends']);
    expect(playableQuestions.filter((q) => q.round === 'friends')).toHaveLength(15);
  });
  it('catches broken questions', () => {
    const broken = { ...allQuestions[0], id: 'x', correctId: 'z', options: allQuestions[0].options.slice(0, 3) };
    const problems = validateBank([...allQuestions, broken]);
    expect(problems.some((p) => p.includes('exactly 4'))).toBe(true);
    expect(problems.some((p) => p.includes('correctId'))).toBe(true);
    expect(validateBank([...allQuestions, allQuestions[0]]).some((p) => p.includes('duplicate'))).toBe(true);
  });
});

describe('randomisation', () => {
  it('shuffle keeps every item exactly once', () => {
    const arr = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffle(arr, seeded(7));
    expect(out.slice().sort((a, b) => a - b)).toEqual(arr);
    expect(out).not.toEqual(arr);
  });
  it('keeps rounds in order and preserves the correct answer by id', () => {
    const plan = buildPlan(activeRounds, playableQuestions, { shuffleQuestions: true, shuffleOptions: true }, seeded(42));
    expect(plan.order).toHaveLength(playableQuestions.length);
    expect(new Set(plan.order).size).toBe(plan.order.length);
    const rounds = plan.order.map((id) => questionsById.get(id)!.round);
    const firstTrivia = rounds.indexOf('trivia');
    const firstFriends = rounds.indexOf('friends');
    expect(rounds.slice(0, firstTrivia).every((r) => r === 'anushka')).toBe(true);
    expect(rounds.slice(firstTrivia, firstFriends).every((r) => r === 'trivia')).toBe(true);
    expect(rounds.slice(firstFriends).every((r) => r === 'friends')).toBe(true);
    let moved = 0;
    for (const id of plan.order) {
      const q = questionsById.get(id)!;
      const order = plan.optionOrder[id];
      expect(order.slice().sort()).toEqual(q.options.map((o) => o.id).sort());
      if (order.indexOf(q.correctId) !== q.options.findIndex((o) => o.id === q.correctId)) moved++;
      // Answering with the correct id is still correct whatever position it's shown in.
      expect(scoreAnswer(q, q.correctId, 30_000, config).correct).toBe(true);
    }
    expect(moved).toBeGreaterThan(0);
  });
  it('can switch shuffling off', () => {
    const plan = buildPlan(activeRounds, playableQuestions, { shuffleQuestions: false, shuffleOptions: false });
    expect(plan.order).toEqual(playableQuestions.map((q) => q.id));
    expect(plan.optionOrder.p01).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('scoring', () => {
  const hard = questionsById.get('t01')!; // hard
  const easy = questionsById.get('p01')!; // easy
  it('scores base, hard and speed bonuses', () => {
    expect(scoreAnswer(easy, easy.correctId, 20_000, config).points).toBe(1);
    expect(scoreAnswer(easy, easy.correctId, 3_000, config).points).toBe(2);
    expect(scoreAnswer(hard, hard.correctId, 20_000, config).points).toBe(2);
    expect(scoreAnswer(hard, hard.correctId, 7_000, config).points).toBe(3);
    expect(scoreAnswer(hard, 'a', 1_000, config).points).toBe(0);
    expect(scoreAnswer(hard, null, 25_000, config)).toMatchObject({ correct: false, points: 0 });
  });
  it('turns bonuses off via config', () => {
    const plain: QuizConfig = { ...config, points: { ...config.points, hardBonus: 0, speedBonus: 0 } };
    expect(scoreAnswer(hard, hard.correctId, 0, plain).points).toBe(1);
    const untimed: QuizConfig = { ...config, timerSeconds: 0 };
    expect(scoreAnswer(easy, easy.correctId, 0, untimed).points).toBe(1);
  });
  it('picks titles at the right thresholds', () => {
    const t = (pct: number) => titleFor(pct, config.scoreTitles).title;
    expect(t(0)).toBe('You Were Here for the Free Drinks');
    expect(t(30)).toBe('You Were Here for the Free Drinks');
    expect(t(30.9)).toBe('You Were Here for the Free Drinks');
    expect(t(31)).toBe('Casual Acquaintance Energy');
    expect(t(50)).toBe('Casual Acquaintance Energy');
    expect(t(51)).toBe('Knows Enough to Be Dangerous');
    expect(t(70)).toBe('Knows Enough to Be Dangerous');
    expect(t(71)).toBe('Certified Anushka Lore Keeper');
    expect(t(85)).toBe('Certified Anushka Lore Keeper');
    expect(t(86)).toBe('Emotionally Invested in the Lore');
    expect(t(99.9)).toBe('Emotionally Invested in the Lore');
    expect(t(100)).toBe('Unemployed Private Investigator');
  });
  it('scores a whole run, ignores duplicates, and finds strongest/weakest categories', () => {
    const answers: AnswerRecord[] = playableQuestions.map((q) => ({
      questionId: q.id,
      choiceId: q.round === 'anushka' ? q.correctId : 'zzz',
      msTaken: 20_000,
    }));
    answers.push({ questionId: 'p01', choiceId: 'a', msTaken: 0 }); // duplicate — must not count twice
    const r = scoreRun(answers, questionsById, config);
    expect(r.correct).toBe(22);
    expect(r.total).toBe(playableQuestions.length);
    expect(r.points).toBe(22 + 3); // three hard personal questions earn the hard bonus
    expect(r.strongest?.category.startsWith('Anushka')).toBe(true);
    expect(r.weakest?.category.startsWith('Anushka')).toBe(false);
    const perfect = scoreRun(playableQuestions.map((q) => ({ questionId: q.id, choiceId: q.correctId, msTaken: 1 })), questionsById, config);
    expect(perfect.pct).toBe(100);
    expect(perfect.points).toBe(perfect.maxPoints);
    expect(perfect.title.title).toBe('Unemployed Private Investigator');
  });
});

describe('game flow', () => {
  const plan = buildPlan(activeRounds, playableQuestions, { shuffleQuestions: true, shuffleOptions: true }, seeded(1));
  it('plays through rounds, blocks double answers and times out', () => {
    let s = game.newGame(config.gameId, 'Test', false, plan);
    expect(s.phase).toBe('round-intro');
    s = game.showQuestion(s, 1000);
    expect(s.phase).toBe('question');
    s = game.answer(s, 'a', 4000, config);
    expect(s.answers).toEqual([{ questionId: plan.order[0], choiceId: 'a', msTaken: 3000 }]);
    const again = game.answer(s, 'b', 5000, config);
    expect(again).toBe(s); // second tap ignored
    let rounds = 1;
    let t = 10_000;
    while (s.phase !== 'end') {
      if (s.phase === 'feedback') s = game.next(s, questionsById, t);
      else if (s.phase === 'round-intro') {
        rounds++;
        s = game.showQuestion(s, t);
      } else s = game.answer(s, null, t + 999_999, config); // timeout
      t += 1000;
    }
    expect(rounds).toBe(3);
    expect(s.answers).toHaveLength(playableQuestions.length);
    expect(s.answers[1].choiceId).toBeNull();
    expect(s.answers[1].msTaken).toBe(config.timerSeconds * 1000); // clamped to the limit
  });
  it('rejects saved games from an older question set', () => {
    const s = game.newGame(config.gameId, 'Test', false, plan);
    expect(game.isCompatible(s, config.gameId, questionsById)).toBe(true);
    expect(game.isCompatible(s, 'other-game', questionsById)).toBe(false);
    expect(game.isCompatible({ ...s, plan: { ...plan, order: plan.order.slice(1) } }, config.gameId, questionsById)).toBe(false);
  });
});

describe('server submission', () => {
  const fullAnswers = (choice: (id: string) => string | null) =>
    playableQuestions.map((q) => ({ questionId: q.id, choiceId: choice(q.id), msTaken: 10_000 }));
  const dev = '0b8c5d6e-1f2a-4b3c-8d9e-0f1a2b3c4d5e';

  it('validates payloads', () => {
    expect(parseSubmission({ deviceId: 'nope', name: 'A', answers: [] }).ok).toBe(false);
    expect(parseSubmission({ deviceId: dev, name: '', answers: fullAnswers(() => null) }).ok).toBe(false);
    expect(parseSubmission({ deviceId: dev, name: 'x'.repeat(30), answers: fullAnswers(() => null) }).ok).toBe(false);
    expect(parseSubmission({ deviceId: dev, name: 'Sam', answers: fullAnswers(() => null).slice(1) }).ok).toBe(false);
    const dupes = fullAnswers(() => null);
    dupes[1] = { ...dupes[0] };
    expect(parseSubmission({ deviceId: dev, name: 'Sam', answers: dupes }).ok).toBe(false);
    expect(parseSubmission({ deviceId: dev, name: 'Sam', answers: fullAnswers(() => 'zz') }).ok).toBe(false);
    const ok = parseSubmission({ deviceId: dev, name: '  <b>Sam</b>  ', answers: fullAnswers(() => null) });
    expect(ok.ok && ok.value.name).toBe('bSam/b');
  });

  it('scores on the server, stores once per phone and once per name', async () => {
    const post = (body: unknown) =>
      submit(new Request('http://x/api/submit', { method: 'POST', body: JSON.stringify(body) }));
    const all = fullAnswers((id) => questionsById.get(id)!.correctId);
    const res = await post({ deviceId: dev, name: 'Franz', answers: all, points: 9999 });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.correct).toBe(playableQuestions.length);
    expect(data.points).toBe(scoreRun(all, questionsById, config).points); // client-sent "points" ignored

    const again = await post({ deviceId: dev, name: 'Someone Else', answers: all });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe('duplicate_device');

    const sameName = await post({ deviceId: '1b8c5d6e-1f2a-4b3c-8d9e-0f1a2b3c4d5e', name: 'FRANZ', answers: all });
    expect((await sameName.json()).code).toBe('duplicate_name');

    const junk = await submit(new Request('http://x/api/submit', { method: 'POST', body: '{nope' }));
    expect(junk.status).toBe(400);

    const board = await (await leaderboard()).json();
    expect(board.entries).toHaveLength(1);
    expect(board.entries[0]).toMatchObject({ name: 'Franz', correct: playableQuestions.length });
  });
});

describe('supabase store', () => {
  it('sends the secret key server-side and maps unique violations', async () => {
    const { supabaseStore } = await import('../api/_lib/store');
    process.env.SUPABASE_URL = 'https://proj.supabase.co/';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_test';
    const calls: { url: string; init: RequestInit }[] = [];
    const replies = [
      new Response(null, { status: 201 }),
      new Response(JSON.stringify({ code: '23505', message: 'duplicate key value violates unique constraint "quiz_results_one_per_device"' }), { status: 409 }),
      new Response(JSON.stringify({ code: '23505', message: 'duplicate key value violates unique constraint "quiz_results_unique_name"' }), { status: 409 }),
      new Response(JSON.stringify([{ name: 'Franz', points: 50, correct: 40, total: 42, pct: 95.2, title: 'X', created_at: '2026-10-17T10:00:00Z' }]), { status: 200 }),
    ];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return replies.shift()!;
    }) as typeof fetch;
    try {
      const store = supabaseStore('https://proj.supabase.co/', 'sb_secret_test');
      expect(store.kind).toBe('supabase');
      const row = { gameId: 'g', deviceId: 'd', name: 'N', nameKey: 'n', points: 1, correct: 1, total: 2, pct: 50, title: 't', categories: [] };
      expect(await store.insert(row)).toBe('ok');
      expect(await store.insert(row)).toBe('duplicate_device');
      expect(await store.insert(row)).toBe('duplicate_name');
      const list = await store.list('g');
      expect(list[0]).toMatchObject({ name: 'Franz', points: 50, pct: 95.2 });
      expect(calls[0].url).toBe('https://proj.supabase.co/rest/v1/quiz_results');
      const h = calls[0].init.headers as Record<string, string>;
      expect(h.apikey).toBe('sb_secret_test');
      expect(h.Authorization).toBeUndefined();
      expect(calls[3].url).toContain('game_id=eq.g');
    } finally {
      globalThis.fetch = realFetch;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });

  it('reports "not configured" on Vercel without credentials', async () => {
    const { getStore } = await import('../api/_lib/store');
    process.env.VERCEL = '1';
    try {
      expect(getStore()).toBeNull();
      const res = await leaderboard();
      expect(res.status).toBe(503);
    } finally {
      delete process.env.VERCEL;
    }
  });
});

describe('supabase storage store (no SQL needed)', () => {
  it('creates the bucket, stores one result per phone and per name, and lists the board', async () => {
    const { storageStore } = await import('../api/_lib/storageStore');
    const files = new Map<string, string>();
    let bucket = false;
    const calls: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: string, init: RequestInit = {}) => {
      const url = new URL(input);
      const method = init.method ?? 'GET';
      calls.push(`${method} ${url.pathname}`);
      expect((init.headers as Record<string, string>).apikey).toBe('sb_secret_test');
      const p = url.pathname.replace('/storage/v1', '');
      if (p === '/bucket') {
        if (bucket) return new Response(JSON.stringify({ statusCode: '409', error: 'Duplicate', message: 'The resource already exists' }), { status: 400 });
        bucket = true;
        return new Response('{}', { status: 200 });
      }
      if (p.startsWith('/object/list/')) {
        const { prefix } = JSON.parse(String(init.body));
        const names = [...files.keys()].filter((k) => k.startsWith(prefix + '/')).map((k) => ({ name: k.slice(prefix.length + 1), id: 'x' }));
        return new Response(JSON.stringify(names), { status: 200 });
      }
      if (p.startsWith('/object/authenticated/quiz-leaderboard/')) {
        const k = p.replace('/object/authenticated/quiz-leaderboard/', '');
        return files.has(k) ? new Response(files.get(k)!, { status: 200 }) : new Response('{"error":"not_found"}', { status: 400 });
      }
      if (p.startsWith('/object/quiz-leaderboard/') && method === 'POST') {
        const k = p.replace('/object/quiz-leaderboard/', '');
        const upsert = (init.headers as Record<string, string>)['x-upsert'] === 'true';
        if (files.has(k) && !upsert) return new Response(JSON.stringify({ statusCode: '409', error: 'Duplicate' }), { status: 400 });
        files.set(k, String(init.body));
        return new Response('{}', { status: 200 });
      }
      if (p === '/object/quiz-leaderboard' && method === 'DELETE') {
        for (const k of JSON.parse(String(init.body)).prefixes) files.delete(k);
        return new Response('[]', { status: 200 });
      }
      return new Response('unexpected', { status: 500 });
    }) as typeof fetch;
    try {
      const store = storageStore('https://proj.supabase.co', 'sb_secret_test');
      const row = (name: string, deviceId: string, points: number) => ({
        gameId: 'g', deviceId, name, nameKey: name.toLowerCase(), points, correct: points, total: 56, pct: 1, title: 't', categories: [],
      });
      expect(await store.insert(row('Franz', 'dev-1', 30))).toBe('ok');
      expect(await store.insert(row('Someone', 'dev-1', 50))).toBe('duplicate_device');
      expect(await store.insert(row('FRANZ', 'dev-2', 40))).toBe('duplicate_name');
      expect(await store.insert(row('Priya', 'dev-2', 40))).toBe('ok');
      expect(await store.insert(row('Other game', 'dev-1', 10).gameId ? { ...row('Zed', 'dev-1', 10), gameId: 'other' } : row('x', 'y', 1))).toBe('ok');
      const board = await store.list('g');
      expect(board.map((e) => e.name)).toEqual(['Priya', 'Franz']);
      expect(calls.filter((c) => c === 'POST /storage/v1/bucket')).toHaveLength(1);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
