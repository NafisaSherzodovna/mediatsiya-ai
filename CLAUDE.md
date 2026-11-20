# Mediatsiya AI — instructions for every Claude session in this repo

Hackathon project for Uzbekistan's Ministry of Justice: an AI-assisted online mediation platform. Two
developers work in parallel, each with their own Claude:
- **A (20 %):** Django backend core and the EC2 deploy.
- **B (80 %):** the Next.js frontend, the AI app, demo data and the pitch docs.

The demo UI must be excellent. Speed beats polished internals.

## Start of every session

1. Find your role. If the user has not said "A" or "B" in this session, ask once: "Siz qaysi roldasiz: A yoki B?"
2. Run `node scripts/sync.mjs <ROLE>`. It fetches and rebases on `origin/main`, lists the new commits with
   `[contract]` ones highlighted, and lists the open issues for your role.
3. Read `docs/plan/00-overview.md`, `contract/api.md` and your role file `docs/plan/<ROLE>.md`.
4. Start the first unchecked task whose needs are met. **Do not wait for confirmation; the plan is approved.**
   Tell the user in one line which task you started.

## Working rules

- **Language:** talk to the user in Uzbek. Code, identifiers, comments and commit messages are in English.
  UI text is Uzbek in classic Latin with `ʻ` (U+02BB), e.g. `oʻ gʻ`.
- **Ownership:** edit only your paths (overview, "Ownership"). Need something from the other role? Mock it,
  keep going, and open a `[for-A]` or `[for-B]` issue.
- **Contract:** `contract/api.md` + `contract/fixtures/` are shared. Additive changes only, in a separate
  `[contract]` commit that also updates the fixture.
- **Tests:** only the ones named in the role files (user decision: speed first). Never block on extra tests.
- **Pitch docs:** after every task, update `docs/pitch/progress.md` (and the requirement status in
  `docs/pitch/02-platforma-talablar.md`) in the same commit. This is part of "done".
- **UI work:** use `.claude/skills/` (frontend-design, impeccable, motion-framer, ui-toolkit) and the `shadcn`
  and `playwright` MCP servers. Follow `DESIGN.md`. Screenshot at 390 px and 1440 px with this laptop's Chrome
  before ticking a UI task.
- **Research:** search the web freely for law text, fees and statistics. Put every number shown to judges into
  `docs/pitch/research.md` with its source URL.

## Git (everyone pushes to `main`, no PRs)

- Small commits with conventional messages. Never add an AI co-author line.
- Before every push: `node scripts/sync.mjs <ROLE>`, then the role check:
  - A: `cd backend && python manage.py check`;
  - B: `cd web && npm run check` and, for backend/ai, `python manage.py test ai`.
  - Then `git push origin HEAD:main`. If it is rejected, sync and retry.
- Never force-push, never rewrite pushed history, never commit `.env*` (except `.env.example`), keys or tokens.
  **The repo is public.**
- Broken `main` caused by your push: fixing it is your top priority.
- Tick the task's checkbox in your role file in the same commit as the code.

## Commands

```
# backend (Python 3.12)
cd backend && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python manage.py migrate && .venv/Scripts/python manage.py runserver 8000
.venv/Scripts/python manage.py test ai cases
.venv/Scripts/python manage.py seed_demo --wipe      # after B14

# frontend
cd web && npm install && npm run dev                 # http://localhost:3000 (mock mode by default)
npm run check                                        # tsc + eslint
npm run build                                        # before deploy / freeze only
```

Local live mode: set `NEXT_PUBLIC_API_MODE=live` in `web/.env.local`. `next.config.ts` rewrites `/api/*` to
`http://localhost:8000` in development.

## Secrets

`backend/.env` (git-ignored) holds `GEMINI_API_KEYS=key1,key2`, `DJANGO_SECRET_KEY` and `DEMO_RESET_KEY`.
On EC2 the same values live in `/etc/mediatsiya.env`. Get them from the team chat, never from git.

## Windows notes

- If `.mcp.json` servers fail to start, add local copies wrapped in `cmd /c`:
  `claude mcp add --scope local playwright -- cmd /c npx -y @playwright/mcp@latest`.
- Prefer the Write tool over bash heredocs for files with Uzbek text; heredocs broke on quotes last time.
- About 2 GB of free RAM: never run two builds at once.
