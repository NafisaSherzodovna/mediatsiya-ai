# Mediatsiya AI — implementation plan (overview)

> **For agentic workers:** Execute your role file (`docs/plan/A.md` or `docs/plan/B.md`) task by task, inline
> (superpowers:executing-plans), without waiting for the other role. Steps use checkbox (`- [ ]`) syntax.

**Goal:** a demo-ready web platform for Uzbekistan's Ministry of Justice hackathon. AI takes a person from
"I have a dispute" to a signed mediation agreement. A human mediator runs the mediation, and the ministry
sees live statistics.

**Architecture:**
- Next.js frontend (`web/`) on Netlify.
- Django + DRF backend (`backend/`) on AWS EC2 in Frankfurt (`eu-central-1`).
- Netlify proxies `/api/*` and `/admin/*` to EC2, so everything runs on one HTTPS origin, with no CORS.
- AI is a stateless Django app (`backend/ai/`) that calls Gemini over REST, with key and model failover and
  rule or template fallbacks.
- The frontend runs on fixtures (mock mode) until the backend is live. The two developers never block each
  other and meet only at the contract (`contract/api.md`).

**Tech stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn (`radix-nova`), motion/react, recharts,
  @number-flow/react, canvas-confetti, lucide-react, swr, sonner, vaul, qrcode.react, zod.
- Backend: Python 3.12, Django 5.2, djangorestframework, gunicorn, whitenoise, httpx, pydantic 2,
  rank-bm25, python-dotenv, and ffmpeg on the server.

**Spec:** `docs/pitch/02-platforma-talablar.md` (requirements FT/AI) and `docs/pitch/01-loyiha-sodda-tushuntirish.md`.

**Product name:** not chosen yet. Use the placeholder `{{BRAND}}` = "Mediatsiya AI" in one place only:
`web/src/lib/brand.ts`, exported as `BRAND`.

## Global constraints

- **UI language:** Uzbek in the **classic Latin alphabet**, written with the modifier letter `ʻ` (U+02BB):
  `oʻ gʻ`, tutuq `ʼ` (U+02BC). Never use an apostrophe `'` or a backtick. Example: "Murojaat qilish",
  "Mediator tanlash", "Kelishuv", "Toʻlov". The user may still switch to the new alphabet
  (Ö Ğ Ş Ç); if so, only `web/src/lib/labels.ts`, the UI copy and the seed text change.
- **Tests: minimal.** The user ruled that speed comes first. The whole test suite is three backend tests:
  `cases.test_invite_flow` (A3), and `ai.test_classify_fallback_cyrillic` and
  `ai.test_classify_criminal_not_mediable` (B3).
  - Before each push, run only the cheap check: A runs `python manage.py check`; B runs `npm run check`
    (`tsc --noEmit` + `eslint`).
  - `npm run build` runs only before a deploy and before the freeze.
  - Write no other tests. Verify by hand (`curl`, one screenshot) instead.
- **Push after every task.** As soon as a task's last step is done, run `node scripts/sync.mjs <ROLE>`,
  the cheap check, then `git push origin HEAD:main`. Never sit on finished work. A long task can be pushed
  mid-way as long as it doesn't break the build.
- **Research: thorough, but time-boxed.** See "Research protocol" below.
- **Secrets:**
  - Gemini keys (`GEMINI_API_KEYS`, comma-separated), `DJANGO_SECRET_KEY`, `DEMO_RESET_KEY` and AWS keys
    never go into git. The repo is **public**.
  - Locally they live in `backend/.env` (git-ignored); on EC2 in `/etc/mediatsiya.env`.
  - Demo login passwords are public on purpose (`contract/api.md`).
- **AI calls:**
  - Budget: 20 s total, 10 s per attempt; no `thinkingConfig` (measured fastest without it).
  - Model order comes from env `GEMINI_MODELS`, default `gemini-3.5-flash-lite,gemini-flash-latest`
    (`flash-lite` answered in 1–4 s at the last hackathon; `flash-latest` often returned 503).
  - Two keys (user request: "server busy → the other key").
  - On failure:
    - 429, 500 or 503 → retry the same model with the next key;
    - once every key has failed on that model → next model;
    - 401/403 → drop the key for the rest of the process;
    - timeout → the other key on the same model (flash-lite latency varies 5–20 s; measured), then next model;
    - 400 → next model.
  - When everything fails, return the fallback with `source:"fallback"`.
  - Measured on 2026-11-20: `gemini-3.5-flash-lite` answered with 200 on both keys in 1.0–5.6 s;
    `gemini-flash-latest` gave 503 in 7.7 s on key 1 and a 20 s timeout on key 2. Keep `flash-lite` first.
- **Commits:**
  - Conventional messages (`feat(web): …`, `feat(api): …`, `feat(ai): …`, `docs(pitch): …`).
  - Never add an AI co-author line.
  - Push straight to `main` after `node scripts/sync.mjs <ROLE>`. Never force-push.
- **Laptop limits:** about 2 GB of free RAM. Never run two `next build`s at once. Check the UI with a
  production build (`npm run build && npm run start`) if the dev server falls into a reload loop.

## Research protocol (both roles)

Good research wins the judges' questions. Bad research burns the clock. Rules:

1. **Before** coding anything that depends on a fact (law text, a fee, a deadline, a statistic) or on an API
   you are unsure of (Next.js 16, Django 5.2/DRF, Gemini REST, Netlify proxying, MediaRecorder), research
   it first.
2. **Primary sources first:**
   - law and figures: lex.uz, gov.uz/adliya, sud.uz, stat.uz;
   - libraries: official docs, plus the Next.js docs bundled in `web/node_modules/next/dist/docs/`;
   - Gemini: ai.google.dev.
   Use news sites (kun.uz, gazeta.uz, uza.uz) for recent numbers only, and name the outlet.
3. **Open the page.** A search snippet is not a source. Run several searches in parallel in one turn; use
   extended search for niche or recent facts.
4. **Time box:** 10–15 minutes per question. Not settled by then: write it as an open question in
   `docs/pitch/research.md`, use a value labelled "taxminiy", and move on.
5. **Record:** every number a judge will see goes into `docs/pitch/research.md` as
   `| fact | value | source URL | date checked |`. Every library decision that surprised you gets one line
   in your role file under the task.

Research topics already assigned:
- **A:**
  - DRF token auth on Django 5.2;
  - gunicorn + systemd on Ubuntu 24.04;
  - whitenoise for admin static files;
  - a cheap and safe EC2 setup (Elastic IP, security group, budget alert).
- **B:**
  - Law OʻRQ-482 articles (for the corpus and citations);
  - state duty for property claims and the court's time limits in civil cases (Civil Procedure Code);
  - mediator fee market in Uzbekistan;
  - the mediation statistics already in `research.md`;
  - analogues for the pitch's "kim bor" slide: online dispute resolution in Kazakhstan, Russia,
    Singapore SIMC, India (Sama, Presolv360), EU ODR;
  - Gemini `responseJsonSchema` and audio input formats;
  - Netlify proxy rules with Next.js 16.

## Review focus

These are the inputs most likely to break the demo that no task tests by default. Each one is pinned to the
task that owns it.

1. **Cyrillic Uzbek or Russian input** in the dispute text. Expected: the dispute is classified the same as
   Latin input. Owner: B3 (the fallback rules normalise Cyrillic to Latin first).
2. **Model down or slow** (503, timeout, no key). Expected: a fallback answer within 20 s, with a small
   "AI zaxira rejimi" note in the UI, never an error page. Owner: B3 (test), B6–B9 (UI note).
3. **A criminal matter** ("urdi", "oʻgʻirladi", "pichoq"). Expected: `mediable:false` with a clear message
   to contact the police or prosecutor; the flow stops kindly. Owner: B3 (test), B6 (UI).
4. **The respondent opens the invite link on a phone with no account.** Expected: the page works without
   login at 390 px and a wrong token shows a friendly 404. Owner: A3 (test), B8.
5. **No microphone, or the user denies permission** (or Safari records mp4). Expected: the text input stays
   usable, the mic button explains the problem, and mp4/webm uploads both transcribe. Owner: B5, B4.

## Ownership (edit only your paths)

| Path | Owner |
|---|---|
| `backend/config/**`, `backend/accounts/**`, `backend/cases/**`, `backend/mediators/**`, `backend/stats/**`, `backend/requirements.txt`, `deploy/**` | A |
| `backend/ai/**`, `backend/demo/**` (A only creates the empty app stubs in A1), `web/**`, `netlify.toml`, `DESIGN.md`, `docs/pitch/**` | B |
| `contract/**` | shared, additive `[contract]` commits only |
| `docs/plan/**`, `CLAUDE.md`, `scripts/**` | B (A may tick its own checkboxes in `A.md`) |

**Need something from the other role?** Mock it in your own path, keep going, and open an issue:
`gh issue create --title "[for-A] <what>" --body "<exact interface>"`.
`backend/requirements.txt` is A's. B adds a package with a separate one-line commit
`chore(deps): add <pkg>` and pushes at once.

## Pitch docs after every task (both roles)

Every task's last step updates the pitch material before its commit:

1. Append one line to `docs/pitch/progress.md`: `| <time> | <task id> | <what the demo can now show, in Uzbek> | <screenshot path or -> |`.
2. If a requirement in `docs/pitch/02-platforma-talablar.md` is now done, change its MVP cell to `Tayyor`.
3. B only: save a 1440 px screenshot of a new screen to `docs/pitch/shots/<task-id>.png`.

## Priorities and timeline (T0 = this plan pushed)

The deadline is not fixed yet. The timeline assumes about 8 working hours. If there is less time, drop P2
first, then P1, in the order listed in each role file.

| When | A (20 %) | B (80 %) |
|---|---|---|
| T+0:30 | A1 scaffold pushed (`/api/health` runs) | B1 web scaffold + design tokens + mock API on Netlify |
| T+2:00 | A2 models + admin, A3 API (contract endpoints) | B2–B5 AI core (classify, compare, invite) + intake wizard |
| T+3:00 | A4 EC2 live, URL posted in issue `[for-B] backend URL` | B6–B8 comparison, invite, respondent page |
| T+5:00 | A5 events + throttle, then help on issues | B9–B11 mediator flow, brief, agreement + PDF, ministry dashboard |
| T+6:30 | — | B12 live wiring (mock → live), B13 demo data + fakes |
| Deadline −1:00 | **FREEZE**: fixes only | B14 final deploy check, pitch docs pass |

**P0 (the demo dies without it):** the full loop `murojaat → AI tasnif → taqqoslash → taklif → javob → mediator → kelishuv PDF`
with demo data, deployed on Netlify. **P1:** voice input, ministry dashboard, mediator workspace and brief.
**P2:** law Q&A (`/huquq`), admin polish, region map.

## Demo script (3 min, the target every task serves)

1. Landing page, then a QR code: the judge opens the site on a phone.
2. `ariza` login → "Murojaat qilish" → voice: "Ijarachim 3 oydan beri toʻlamayapti" → AI classifies it as
   *Ijara qarzi* and says it can go to mediation.
3. The court-vs-mediation screen: days and soʻm side by side, animated.
4. AI writes a neutral invite → "Telegram orqali yuborish" → the invite link opens on a second phone →
   "Rozi boʻlish" → 3 quick answers.
5. Mediator catalog → Dilnoza Rahimova → time booked.
6. `mediator` login → AI brief (common ground, ZOPA) → "Kelishuv loyihasi" → stamp animation → PDF.
7. `vazirlik` login → dashboard: 278 cases, 61.5 % agreed, average 9.4 days, by region and month.
   Closing line: "Bugun bu raqamni hech kim koʻrmaydi — biz uni beramiz." EBRD notes that no separate
   mediation statistics exist (`docs/pitch/research.md`).
