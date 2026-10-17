# Anushka Turns 30 — the birthday quiz

A mobile-first party quiz. Send one link; every friend plays on their own phone, gets a score and a title, and lands on a shared leaderboard.

- **Round 1 — The Anushka Files:** 11 confirmed-fact questions + 11 playful predictions (clearly labelled as intended answers, not facts).
- **Round 2 — Big Brain Hours:** 20 hard-ish trivia questions (architecture & design, film & TV, music, internet culture, general knowledge, art).
- **Round 3 — The Friend Group Lore:** empty and hidden until you add questions (see below).

42 questions, ~25 minutes as shipped; ~30 once the friends round is in.

---

## How it's built (and why)

| Piece | What it does |
|---|---|
| React + TypeScript + Vite | The quiz itself, a static site. No heavy UI libraries; fonts are self-hosted. |
| Two Vercel Functions (`/api/submit`, `/api/leaderboard`) | Receive finished games, **re-score them on the server**, save them, and serve the leaderboard. |
| Supabase (Postgres) | Stores one row per player. Only the server functions can touch it. |

Why a backend at all: browser storage lives on one phone, so it can never show friends each other's scores. The functions keep the Supabase secret key server-side — the browser never sees it.

**Protections**
- One leaderboard score per phone (a random id stored on the phone + a database unique constraint). Replays are allowed but don't post.
- No duplicate names (`Sam` vs `sam` clash → the player is asked to add an initial).
- The server ignores any score the browser claims and recomputes it from the answers. Unknown questions, repeated answers, partial games and invalid options are rejected.
- Request size is capped; names are cleaned and limited to 24 characters.
- Row Level Security is on with no policies, so the public internet can't read or write the table directly.

Honest limits: it's a party game, not an exam. A determined friend could open dev tools and read the answers, or clear their browser to post twice under a new name. You can delete any row in Supabase (snippets in `supabase/schema.sql`).

**Without Supabase** the app still works: every phone plays solo, sees its own score, and the leaderboard section says it isn't switched on.

---

## The TV screen (`/tv`)

Open **`https://<your-link>/tv`** on whatever drives the TV: a laptop plugged in by HDMI, a smart-TV browser, or a laptop/phone cast with AirPlay or Chromecast. Click **Full screen**.

It shows:
- a big QR code and short URL so people can join by scanning the TV
- the live leaderboard (top 10, everyone else on one line), refreshing every 4 seconds
- a gold "just finished" banner and highlighted row whenever someone completes the quiz
- finished count, top score and average

Host controls sit faintly in the bottom-right corner (keyboard shortcuts in brackets):
- **Hide scores** (H) — shows only who's finished, so nobody knows who's winning until the end
- **Reveal the winners** (F) — switches to a podium. Each click, Space or → reveals the next place, 3rd → 2nd → 1st, with a fanfare and confetti for the winner. Ties show as "Joint 2nd". Esc goes back.
- **Full screen**

Tap or click once on the TV page before the finale so the browser allows sound.

Everyone plays at their own pace on their own phone; the TV is the shared scoreboard, not a synchronised question-by-question screen.

The quiz itself also adapts to big screens (two-column answers, larger type) if someone casts their phone.

---

## Project structure

```
anushka-30/
├── src/
│   ├── data/                 ← EVERYTHING YOU'LL WANT TO EDIT
│   │   ├── config.ts         timer, shuffling, points, score titles, gameId
│   │   ├── rounds.ts         round names, blurbs, drinking rules
│   │   ├── personal.ts       Round 1 questions
│   │   ├── trivia.ts         Round 2 questions
│   │   └── friends.ts        Round 3 — paste friend questions here
│   ├── core/                 shared logic used by browser AND server
│   │   ├── bank.ts           combines questions + validates them
│   │   ├── scoring.ts        points, bonuses, titles, categories
│   │   ├── shuffle.ts        question/option randomisation
│   │   ├── game.ts           game state machine
│   │   └── types.ts
│   ├── components/           screens (start, round intro, question, end, leaderboard, TvScreen)
│   ├── tv.css                TV-only styles (loaded only on /tv)
│   ├── lib/                  sound, confetti, storage, API client
│   └── styles.css
├── api/
│   ├── submit.ts             POST /api/submit
│   ├── leaderboard.ts        GET  /api/leaderboard
│   └── _lib/                 validation + Supabase/in-memory store
├── supabase/schema.sql       run once in Supabase
├── tests/quiz.test.ts        18 tests: scoring, shuffling, timer flow, API, dedupe
├── .env.example
└── vercel.json
```

---

## Run it locally

Needs Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173 — also prints a Network URL for phones on your Wi-Fi
npm test           # run the test suite
npm run build      # production build
```

Locally, the leaderboard runs **in memory** (no Supabase needed) and resets when you stop the server — perfect for testing with a couple of phones on the same Wi-Fi.

---

## Go live: Supabase + Vercel (about 15 minutes)

You need free accounts on **GitHub**, **Supabase** and **Vercel**. Nothing here costs money at party scale.

### 1. Create the database (Supabase)
1. supabase.com → **New project** (any name, e.g. `anushka-30`, region Sydney). Save the database password somewhere.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
3. Go to **Project Settings → API Keys** and copy:
   - the **Project URL** (`https://xxxx.supabase.co`, under Project Settings → Data API on newer dashboards)
   - the **secret key** (`sb_secret_…`). On older projects it's called the **service_role** key — either works.

### 2. Put the code on GitHub
Create a new **private** repo and upload this folder (GitHub Desktop or the web uploader is fine). Don't upload `node_modules` or `.env`.

### 3. Deploy on Vercel
1. vercel.com → **Add New → Project** → import the repo. It detects Vite automatically.
2. Before clicking Deploy, open **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your secret / service_role key |
3. Click **Deploy**. Your link is the `https://<project>.vercel.app` address Vercel shows.

If you add or change env vars later, redeploy (Deployments → ⋯ → Redeploy) so they take effect.

### 4. Check it works
Open `https://<your-link>/api/leaderboard` — you should see `{"configured":true,"mode":"supabase","entries":[]}`. Then play once on your phone and confirm your name appears.

### 5. Before the party: clear your test scores
Either run `delete from quiz_results where game_id = 'anushka-30';` in the Supabase SQL editor, or change `gameId` in `src/data/config.ts` (e.g. `'anushka-30-party'`) and push — that starts a fresh board. Also tap **Play again** on any phone you tested with; note that a phone that already posted to a board can't post to it again (changing `gameId` resets that too).

---

## Adding the friend-group questions

Open **`src/data/friends.ts`**. The file explains the format and has a copy-paste template. Paste your questions inside the `[ ]`, push to GitHub, and Vercel redeploys automatically. The round appears on its own once it has at least one question.

If you'd rather not touch code, paste the questions into a chat with Claude and ask for them in this format.

If you make a mistake (missing option, wrong `correctId`, duplicate id), the app shows a "question file needs a fix" screen listing exactly what's wrong instead of breaking mid-party. Run `npm test` to catch it before deploying.

**Important:** adding or removing questions changes the game, so anyone mid-game when you redeploy restarts. Finish edits before people start playing.

---

## Settings you can change (`src/data/config.ts`)

| Setting | Default | Notes |
|---|---|---|
| `timerSeconds` | 25 | `0` turns the timer (and speed bonus) off |
| `shuffleQuestionsWithinRound` | true | rounds always stay in order |
| `shuffleOptions` | true | correct answers are tracked by id, so shuffling is safe |
| `points.correct` | 1 | |
| `points.hardBonus` | 1 | extra for `difficulty: 'hard'` |
| `points.speedBonus` / `speedBonusWithinSeconds` | 1 / 7 | extra for answering fast |
| `scoreTitles` | your six titles | picked from % correct, rounded down; 100% only for a perfect run |

Ranking on the leaderboard: points, then number correct, then who finished first.

---

## Notes on the content

- **Q7 (thesis):** the brief asked for option D, "[re] Defining Refuge: The Learning Centre", as correct, but also said only "[re] refuge — home away from home" is confirmed. To avoid inventing details, option D now reads **"[re] refuge — home away from home"** (still the correct option). Option C was "Home Away From Home", which would be a partly-correct answer, so it's now a fictional distractor. Edit `p07` in `personal.ts` if you want it different.
- Questions p12–p22 are jokes with an intended answer; the app labels them "Intended answer, not a verified fact".
- Drinking mode is off by default and every penalty says it can be skipped.
