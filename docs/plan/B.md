# Role B — frontend, AI, demo (80 %)

You own `web/`, `backend/ai/`, `backend/demo/`, `netlify.toml`, `DESIGN.md` and `docs/pitch/`.

- Read `docs/plan/00-overview.md` and `contract/api.md` first.
- Until A's backend is live you work in **mock mode**: `NEXT_PUBLIC_API_MODE=mock` serves `contract/fixtures`.
  Never wait for A.
- If A1 is not on `main` yet, do B1 first; B2 needs A1's stubs.

**UI bar:** "juda zoʻr UI".
- Use the skills in `.claude/skills/` (frontend-design, impeccable, motion-framer) and the `shadcn` and
  `playwright` MCP servers.
- Follow `DESIGN.md`.
- After every screen task, take Playwright screenshots at 390 px and 1440 px with this laptop's Chrome
  (`channel: "chrome"`, headless) and look at them before ticking the box.
- The fonts once fell back to Times, so check that the font really renders.

Order when time is short:
- P0: B1, B2, B3, B5, B6, B7, B8, B9, B10, B11, B13, B14, B16.
- P1: B4, B12.
- P2: B15.

---

### B1: Web scaffold, design system, mock API, Netlify (P0)

**Files:**
- Create in `web/`: a Next.js 16 app (App Router, TypeScript, Tailwind v4, `src/` dir) and shadcn init
  (`radix-nova`).
- Create: `src/lib/{brand,labels,types,api,auth,format}.ts`, `src/components/brand/{logo,backdrop,ai-thinking,ai-source-chip,avatar}.tsx`,
  `scripts/copy-fixtures.mjs`, `netlify.toml` (repo root), `DESIGN.md` (repo root; already drafted, refine it).
- Packages: `motion recharts @number-flow/react canvas-confetti lucide-react swr sonner vaul qrcode.react zod`.

**Interfaces — produces (everything later uses these):**
- `types.ts`: the TypeScript types from `contract/api.md`, copied verbatim.
- `labels.ts`: `DISPUTE_LABEL: Record<DisputeType,string>`, `STATUS_LABEL`, `REGION_LABEL`, `ROLE_HOME: Record<Role,string>`
  (`claimant → /ishlar`, `mediator → /mediator`, `ministry → /vazirlik`, `admin → /vazirlik`).
- `format.ts`: `som(n: number): string` returns `"9 000 000 soʻm"` (narrow no-break space groups);
  `days(min,max): string` returns `"3–14 kun"`; `dateUz(iso): string` returns `"24-noyabr, 10:00"`.
- `api.ts`:
  - `api<T>(path: string, init?: {method?: string; body?: unknown; form?: FormData}): Promise<T>`.
  - `live` mode: `fetch("/api"+path)` with the `Authorization` header from `auth.ts`; a non-2xx response
    throws `ApiError {status, detail}`.
  - `mock` mode: a router over `src/fixtures/*.json` with an 400–900 ms delay; `POST /cases/` and
    `PATCH /cases/:id/` persist to `sessionStorage`, so the whole flow works offline.
  - Export `isMock()`.
- `auth.ts`: `login(username, password)`, `logout()`, `useUser(): {user: User | null, ready: boolean}`
  (token and user in `localStorage`, wrapped in try/catch), `RequireRole({roles, children})` (client guard
  that redirects to `/kirish`).
- `copy-fixtures.mjs`: copies `../contract/fixtures/*.json` to `src/fixtures/`. It runs in `predev` and
  `prebuild`.
- `package.json` scripts: `check` = `tsc --noEmit && eslint .`.
- `next.config.ts`: in development only, `rewrites()` maps `/api/:path*` → `http://localhost:8000/api/:path*`,
  so live mode works locally.
- `netlify.toml` (root):
  - `[build] base="web"`, `command="npm run build"`, `publish=".next"`;
  - `[build.environment] NEXT_PUBLIC_API_MODE="mock"`;
  - the `/api/*` proxy is added in B13.
- `<AiThinking steps={string[]} minMs={1600} />`: a staged checklist animation (each step ticks in turn) used
  while any AI call runs.
- `<AiSourceChip source />` shows "AI zaxira rejimi" only for `fallback`.
- `<Avatar name />` shows initials on a tinted disc. Never use real photos of people.

- [x] **Step 1:** Scaffold, install the packages, set the fonts and tokens from `DESIGN.md` in `globals.css`,
  and build `/dev/kit` (a page that shows buttons, cards, chips, AiThinking and the number styles).
- [x] **Step 2:** `npm run check` passes. Take a screenshot of `/dev/kit` and check that the font is Onest,
  not Times, and that `oʻ gʻ` render correctly.
- [ ] **Step 3:** The user connects Netlify in the browser (Nafisa's account): New site from Git →
  `NafisaSherzodovna/mediatsiya-ai` → base `web`. Guide them step by step. Write the site URL into
  `docs/pitch/links.md`.
- [x] **Step 4:** Pitch docs: `progress.md` line + `shots/B1.png`. Commit `feat(web): scaffold, design system, mock api`, then push.

### B2: AI client with failover (P0, Python)

**Files:**
- Create: `backend/ai/client.py`, `backend/ai/schemas.py`, `backend/ai/prompts.py`, `backend/ai/text.py`.

**Interfaces — produces:**
- `client.generate_json(system: str, parts: list[dict], schema: type[BaseModel], *, total_s: float = 20, attempt_s: float = 8) -> BaseModel | None`
- `client.generate_text(system: str, parts: list[dict], *, total_s: float = 20, attempt_s: float = 8) -> str | None`
- `parts` are Gemini parts: `{"text": ...}` or `{"inline_data": {"mime_type": ..., "data": <b64>}}`.
- REST call: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`,
  header `x-goog-api-key`, body:
  - `systemInstruction`, `contents=[{role:"user", parts}]`;
  - `generationConfig`: `temperature 0.4`, `thinkingConfig {thinkingLevel:"low"}`, and for JSON also
    `responseMimeType:"application/json"` and `responseJsonSchema: schema.model_json_schema()`.
- Response handling: drop `thought` parts and validate with `schema.model_validate_json`. Failover follows
  the overview's global constraints. Returns `None` when everything fails.
- Logs `[ai] <model> key#<n> -> OK <ms> ms | HTTP <code> | timeout`. Never log the key.
- Port the logic from Nihol's `src/lib/ai/client.ts` (public repo `abiya-abiya/nihol`).
- `schemas.py`: pydantic models `Classification`, `Comparison` (notes only), `InviteOut`, `Position`, `Brief`,
  `Agreement`, `AskOut`. They match `contract/api.md` without `source`; views add `source`.
- `text.py`: `normalize(s: str) -> str` turns Cyrillic Uzbek or Russian letters into Latin (`ў→oʻ`, `ғ→gʻ`,
  `ш→sh`, `ч→ch`, `қ→q`, `ҳ→h`, the rest by a table), lowercases, and maps `' ‘ ’ \``` to `ʻ`.
- `prompts.py` holds one system prompt per endpoint. Every prompt:
  - answers in Uzbek, classic Latin with `ʻ`;
  - is neutral and non-judgmental;
  - never gives a legal verdict;
  - stays short (≤ 120 words per field);
  - for the invite: no accusation, explains the benefit to both sides, ends with one clear next step.

- [x] **Step 1:** Write the files. Add `GEMINI_API_KEYS` to `backend/.env` (the keys are in the team chat or
  `D:\projects\ai-xakaton\ildiz-env-local.txt`; never commit them).
- [x] **Step 2:** Smoke-test from the shell:
  `python -c "import django,os;os.environ['DJANGO_SETTINGS_MODULE']='config.settings';django.setup();from ai.client import generate_text;print(generate_text('Javob: salom',[{'text':'Salom de'}]))"`.
  It prints Uzbek text, and the log shows `-> OK`.
- [x] **Step 3:** Pitch docs: `progress.md` line ("Gemini ulandi: kalit/model almashinuvi bilan").
  Commit `feat(ai): gemini client with failover`, then push.

### B3: AI classify, compare and invite with fallbacks (P0)

**Files:**
- Create: `backend/ai/{views,urls,fallbacks}.py`, `backend/ai/data/costs.json`, `backend/ai/tests.py`.

**Interfaces — produces:**
- `POST /api/ai/classify/`, `/compare/` and `/invite/` per the contract. All views: `throttle_scope="ai"`,
  `AllowAny`, `source` = `"ai"` or `"fallback"`.
- `fallbacks.classify(text) -> dict` uses keyword rules on `normalize(text)`:
  - `ijara|kvartira|uy egasi|ijarachi` → `ijara`
  - `qarz|qarzdor|pul berib|qaytarmayapti` → `qarz`
  - `ajrash|aliment|turmush|er-xotin` → `oilaviy`
  - `ish haqi|maosh|ishdan|ish beruvchi` → `mehnat`
  - `doʻkon|mahsulot|xizmat|kafolat|qaytarish` → `istemolchi`
  - `qoʻshni` → `qoshnichilik`
  - otherwise `boshqa`.
  - `amount_uzs` comes from the first number with "mln/million" (×1 000 000) or plain digits ≥ 10 000.
- **Criminal guard (always applied, also after the AI answer):** if `normalize(text)` matches
  `urdi|kaltak|oʻgʻirla|pichoq|zoʻrla|oʻldir|giyohvand|tahdid`, set `mediable=false` with
  `reason="Bu holat jinoyat belgilariga ega. Mediatsiya qoʻllanmaydi — ichki ishlar organlari yoki prokuraturaga murojaat qiling."`.
- `compare` reads `costs.json` and fills `Track`s for the dispute type and amount. The model only writes
  `notes` (≤ 3); fallback notes are fixed strings.
- `costs.json` keys: `court_fee` (rule for property claims), `court_days [min,max]`, `lawyer_uzs`,
  `mediator_session_uzs`, `mediation_sessions`, `mediation_days [min,max]`, `fee_refund_note`,
  `sources [{title,url}]`.
- **Research these numbers now from primary sources**: the Law on state duty and the Civil Procedure Code
  on lex.uz, and the 2025 kun.uz mediation interview (state duty refunded on a successful mediation). Write
  each value with its source into `docs/pitch/research.md`. Values without a source are labelled
  "taxminiy" in the UI.
- `fallbacks.invite(...)` is a template; the fixture text is a good example.

- [x] **Step 1:** Write `backend/ai/tests.py` with exactly **two** tests. Both set `settings.GEMINI_API_KEYS=""` so
  the fallback runs; these are the stage failures that would hurt most.
  - `test_classify_fallback_cyrillic`: text "Ижарачим 3 ойдан бери тўламаяпти, қарзи 9 миллион" → 200,
    `dispute_type=="ijara"`, `mediable is True`, `amount_uzs==9000000`, `source=="fallback"`.
  - `test_classify_criminal_not_mediable`: "Qoʻshnim meni urdi va telefonimni oʻgʻirladi" → `mediable is False`.

  Check the short-text 400 and the Latin input by hand with `curl`.
- [x] **Step 2:** Implement until `python manage.py test ai` passes. Then hit each endpoint once with a real key
  and check the Uzbek quality by reading it.
- [x] **Step 3:** Pitch docs: `progress.md`, `research.md` (cost numbers + sources), `02` doc AI-1, AI-3, AI-4 → `Tayyor`.
  Commit `feat(ai): classify, compare, invite with rule fallbacks`, then push.

### B4: Voice transcription (P1)

**Files:**
- Modify: `backend/ai/views.py`, `backend/ai/urls.py`.

**Interfaces — produces:**
- `POST /api/ai/transcribe/`:
  - Reads multipart `audio` (≤ 3 MB). Converts it with
    `ffmpeg -i in -ac 1 -ar 16000 -c:a libopus out.ogg`; the binary comes from env `FFMPEG_BIN`
    (default `ffmpeg`; on this laptop `D:\tools\ffmpeg\...`).
  - Sends `inline_data audio/ogg` with the prompt "Ushbu nutqni soʻzma-soʻz yozib bering. Oʻzbekcha boʻlsa,
    lotin yozuvida (oʻ, gʻ bilan)."
  - On failure → `{text:"", source:"fallback"}` with 200.
- [x] **Step 1:** Implement. Verify with a 5 s Uzbek recording (record one in the browser after B6, or use
  any `.webm`/`.m4a`) → the transcript reads correctly.
- [x] **Step 2:** Pitch docs: `progress.md`, AI-2 → `Tayyor`. Commit `feat(ai): voice transcription via ffmpeg + gemini`, then push.
  Open the issue `[for-A] install ffmpeg on EC2` if A4 is done without it.

### B5: Landing, login, app shell (P0)

**Files:**
- Create: `web/src/app/page.tsx` (landing), `web/src/app/kirish/page.tsx`, `web/src/components/shell/{app-header,role-nav}.tsx`,
  `web/src/components/landing/*`.

**Interfaces — produces:**
- Landing sections:
  - hero: "Nizoni sudsiz, bir necha kunda hal qiling" with a primary CTA "Murojaat qilish" → `/kirish?next=/murojaat`;
  - 3 steps with icons (Yozing yoki gapiring → AI tahlil → Mediator bilan kelishuv);
  - "Sud va mediatsiya" mini comparison from `compare.json`;
  - verified numbers from `research.md` (mediated cases 4 800 in 2021 → 7 200 in 2024, 6 200+ cases
    withdrawn in 2024), each with a source link;
  - a QR code to the landing URL;
  - a footer with the demo disclaimer "Demo maʼlumotlar".
- `/kirish`: username/password form plus 3 demo chips (Murojaatchi, Mediator, Vazirlik) that fill the fields.
  After login go to `?next` or `ROLE_HOME[role]`.
- `AppHeader`: logo, role-specific nav, user name, "Chiqish".

- [x] **Step 1:** Build it in mock mode and take screenshots at 390 and 1440 px. Use the motion entrance
  stagger, NumberFlow on the numbers, and no layout shift.
- [x] **Step 2:** `npm run check`. Pitch docs: `progress.md`, `shots/B5.png`. Commit `feat(web): landing, login, shell`, then push.

### B6: Intake — describe, classify, compare (P0)

**Files:**
- Create: `web/src/app/murojaat/page.tsx` (wizard state machine), `web/src/components/intake/{describe-step,voice-button,classify-card,compare-step}.tsx`.

**Interfaces:**
- Consumes `api('/ai/classify/')`, `api('/ai/compare/')` and `api('/ai/transcribe/')`.
- Produces the wizard state `{text, classification, comparison, respondent, inviteText}`. B7 continues it.

- [x] **Step 1 (describe):**
  - A large textarea with 3 example chips that fill it (ijara, qarz, isteʼmolchi) and a 20-char minimum
    with a live hint.
  - `<VoiceButton onText>`: MediaRecorder; choose `audio/webm;codecs=opus`, else `audio/mp4`; 60 s cap;
    waveform while recording; uploads, then appends the text.
  - Permission denied → inline note "Mikrofonga ruxsat berilmadi — matn bilan yozing".
  - No `MediaRecorder` → hide the button.
- [x] **Step 2 (classify):**
  - `AiThinking` with steps "Matn oʻqilmoqda", "Nizo turi aniqlanmoqda", "Qonun bilan solishtirilmoqda".
  - Then the card: type label, summary, amount, confidence ring and `AiSourceChip`.
  - If `mediable === false`: a calm red-pen card with the reason and contact suggestions; the wizard stops.
- [x] **Step 3 (compare):**
  - Two columns, "Sud" vs "Mediatsiya". Day bars and cost bars grow with spring motion; numbers use
    NumberFlow; item breakdowns; notes; source links; the "taxminiy" label.
  - CTA "Mediatsiyani tanlash".
- [x] **Step 4:** Screenshots of each step at 390 and 1440 px. Pitch docs: `progress.md`, `shots/B6.png`,
  FT-2/FT-4 → `Tayyor`. Commit `feat(web): intake wizard with ai classify and compare`, then push.

### B7: Invite and case creation (P0)

**Files:**
- Create: `web/src/components/intake/{respondent-step,invite-step,sent-step}.tsx`.

- [x] **Step 1:**
  - The respondent step collects name and phone (`+998` mask).
  - The invite step shows `AiThinking`, then an editable invite text with the `checks` as green ticks.
  - "Yuborish" → `POST /cases/` (whole wizard state) → the sent step:
    - a big success state;
    - the invite link `${origin}/taklif/${invite_token}`;
    - buttons "Telegram orqali" (`https://t.me/share/url?url=…&text=…`), "Nusxa olish" and a QR code;
    - "Ishni koʻrish" → `/ishlar/[id]`.
- [x] **Step 2:** Screenshots. Pitch docs: `progress.md`, FT-5 → `Tayyor`. Commit `feat(web): ai invite and case creation`, then push.

### B8: Respondent page `/taklif/[token]` (P0, public, phone-first)

**Files:**
- Create: `web/src/app/taklif/[token]/page.tsx`, `web/src/components/respondent/*`.

- [x] **Step 1:**
  - `GET /invite/{token}/` → a calm letter-style card with the invite text and "Mediatsiya nima?" (3 lines,
    expandable).
  - Two buttons: "Rozi boʻlish" and "Rad etish".
  - Accepting asks 3 questions one at a time:
    1. "Vaziyatni oʻz soʻzingiz bilan qisqacha yozing"
    2. "Siz nimani xohlaysiz?"
    3. "Nimani taklif qila olasiz?"
  - Then `POST /ai/position/` → `POST /invite/{token}/respond/ {accept:true, position}` → thank-you screen
    with the next steps.
  - A wrong token → friendly 404 "Taklif topilmadi yoki muddati oʻtgan".
- [x] **Step 2:** Screenshot at 390 px (the second phone on stage). Pitch docs: `progress.md`, `shots/B8.png`.
  Commit `feat(web): respondent invite page`, then push.

### B9: AI position, brief and agreement (P0, Python)

**Files:**
- Modify: `backend/ai/{views,urls,fallbacks}.py`.

**Interfaces — produces:**
- `POST /api/ai/position/`, `/brief/` and `/agreement/` per the contract.
- `fallbacks.brief` builds common ground from overlapping words in `wants` and `can_offer`, plus a template
  ZOPA.
- `fallbacks.agreement` returns 5 clauses (Tomonlar, Majburiyat, Toʻlov jadvali, Kafolat, Ijro), filled from
  `terms`.
- The agreement prompt must produce numbered clauses. `citations` = a static list
  `[{article:"Mediatsiya toʻgʻrisidagi qonun", title:"Mediativ kelishuv", url:"https://lex.uz/acts/3805227"}]`
  until B15 replaces it with retrieval.
- [x] **Step 1:** Implement. Check each endpoint once with a real key using the fixture inputs, and read the Uzbek.
- [x] **Step 2:** Pitch docs: `progress.md`, AI-5/6/7 → `Tayyor`. Commit `feat(ai): position, brief, agreement`, then push.

### B10: Claimant case page and mediator booking (P0)

**Files:**
- Create: `web/src/app/ishlar/page.tsx`, `web/src/app/ishlar/[id]/page.tsx`, `web/src/components/case/{status-badge,timeline,position-card}.tsx`,
  `web/src/components/mediators/{mediator-card,filters,booking-sheet}.tsx`.

- [x] **Step 1:**
  - `/ishlar`: case cards with status badges and an empty state with a CTA.
  - `/ishlar/[id]`: animated vertical timeline from `events`, the parties, both position cards once
    accepted, and the next-action panel by status:
    - `invited`: "Javob kutilmoqda" + resend link;
    - `accepted`: "Mediator tanlash";
    - `scheduled`: session card;
    - `agreed`: "Kelishuvni koʻrish".
  - Mediator choice is a sheet (vaul on mobile, dialog on desktop): filters for type, region and language;
    cards with avatar initials, rating, sessions, price and registry no; pick date and time chips →
    `POST /cases/{id}/book/` → confetti-free calm success.
- [x] **Step 2:** Screenshots. Pitch docs: `progress.md`, FT-6/7/8 → `Tayyor`. Commit `feat(web): case page, timeline, mediator booking`, then push.

### B11: Mediator workspace, agreement and PDF (P0)

**Files:**
- Create: `web/src/app/mediator/page.tsx`, `web/src/app/mediator/[id]/page.tsx`, `web/src/app/ishlar/[id]/kelishuv/page.tsx`,
  `web/src/components/case/{brief-card,agreement-editor,agreement-doc,stamp}.tsx`.

- [x] **Step 1:** `/mediator` lists the assigned cases. `/mediator/[id]`:
  - "AI maʼlumotnoma" button → `POST /ai/brief/` (with `AiThinking`) → brief card: facts, two columns of
    wants, common ground highlighted, the ZOPA line in a highlighter, risks. Save it with `PATCH brief`.
  - "Kelishuv loyihasi" → term chips prefilled from `suggested_options` → `POST /ai/agreement/` → an
    editable clause list → "Yakunlash" → `PATCH {agreement, status:"agreed"}` → the **stamp animation**
    (`Stamp`: scales from 1.6 to 1 with a slight rotation and a ring ripple) → "PDF yuklab olish".
- [x] **Step 2:** `/ishlar/[id]/kelishuv` is an A4 print view (`@media print`, document serif from
  `DESIGN.md`, parties, clauses, citations, signature lines, a QR to the case). The button calls
  `window.print()`. Check "Save as PDF" in Chrome.
- [x] **Step 3:** Screenshots, plus the printed PDF in `docs/pitch/shots/B11-kelishuv.pdf`. Pitch docs:
  `progress.md`, FT-9 → `Tayyor`. Commit `feat(web): mediator workspace, ai brief, agreement and pdf`, then push.

### B12: Ministry dashboard `/vazirlik` (P1)

**Files:**
- Create: `web/src/app/vazirlik/page.tsx`, `web/src/components/ministry/{kpi-tiles,monthly-chart,by-type-bars,by-region-bars}.tsx`.

- [ ] **Step 1:** Load the dataviz skill first. From `GET /stats/`:
  - KPI tiles with NumberFlow: total cases, agreed + rate, average days, refunded fees in soʻm, active mediators;
  - a monthly line (cases vs agreed);
  - horizontal bars by type and by region (14 regions, sorted);
  - a note "Demo maʼlumotlar" and a "Maʼlumotlar shaxsiylashtirilmagan" chip.
- [ ] **Step 2:** Screenshots. Pitch docs: `progress.md`, FT-10 → `Tayyor`. Commit `feat(web): ministry dashboard`, then push.

### B13: Live wiring — Netlify proxy to EC2 (P0, needs A4's issue `[for-B] backend URL`)

**Files:**
- Modify: `netlify.toml`, `web/src/lib/api.ts`.

- [ ] **Step 1:** Add proxy rules, all `status=200, force=true`:
  - `/api/*` → `http://<IP>:8000/api/:splat`
  - `/admin/*` → `http://<IP>:8000/admin/:splat`
  - `/static/*` → `http://<IP>:8000/static/:splat`
- [ ] **Step 2:** Set `NEXT_PUBLIC_API_MODE="live"`. In `api.ts`, AI paths (`/ai/*`) that throw fall back to
  the fixture with `source:"fallback"`, so the stage never shows an error.
- [ ] **Step 3:** After deploy: `curl https://<site>.netlify.app/api/health` → `{"ok":true,"ai":true}`.
  If Netlify's Next runtime ignores the toml proxy, use `next.config.ts` `rewrites()` to
  `${process.env.BACKEND_URL}` instead (env set in the Netlify UI).
- [ ] **Step 4:** Run the full demo loop on the live site with two browser contexts (claimant and respondent).
  Pitch docs: `progress.md`, `links.md`. Commit `feat(web): live backend via netlify proxy`, then push.

### B14: Demo data and stage fakes (P0)

**Files:**
- Create: `backend/demo/management/commands/seed_demo.py`, `backend/demo/views.py`, `backend/demo/urls.py`,
  `web/src/app/demo/page.tsx`, `web/src/lib/demo.ts`.

**Interfaces — produces:**
- `python manage.py seed_demo [--wipe]` is idempotent and uses `random.seed(42)`. It creates:
  - 12 mediators: `m-01`…`m-06` from the fixture plus 6 more; the `mediator` user is linked to `m-01`;
    no photos.
  - 276 background cases from Jan to Nov 2026, matching the totals and distributions in
    `contract/fixtures/stats.json` (61.5 % agreed, each agreed case has `comparison` + `agreement` +
    `agreed_at`).
  - 2 showcase cases for `ariza`, identical to `cases.json` (`MD-2026-0041` agreed, `MD-2026-0042`
    scheduled), giving 278 in total.
- `POST /api/demo/reset/` checks the `X-Demo-Key` header and runs `seed_demo --wipe`.
- `/demo` (unlisted page):
  - "Demo holatini tiklash" (asks for the key once, keeps it in localStorage);
  - "Namuna ovoz" (puts the prepared transcript "Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million
    soʻm boʻldi" into the intake without a mic);
  - "Javoblarni avtomatik toʻldirish" for the respondent's 3 answers;
  - links that open the demo accounts.
- [ ] **Step 1:** Implement and run `seed_demo --wipe` locally. Check that `/vazirlik` shows 278 / 61.5 %.
- [ ] **Step 2:** Open the issue `[for-A] run seed_demo --wipe on EC2` (or run it yourself if you have SSH).
  Pitch docs: `progress.md`, `links.md` (demo accounts table). Commit `feat(demo): seed data, reset endpoint, stage helpers`, then push.

### B15: Law Q&A with retrieval (P2)

**Files:**
- Create: `backend/ai/corpus/mediatsiya-qonuni.md` (the law's articles copied from lex.uz/acts/3805227, one
  `## <N>-modda. <title>` per article), `backend/ai/retrieval.py`, `web/src/app/huquq/page.tsx`.

**Interfaces — produces:**
- `retrieval.top_k(question: str, k: int = 3) -> list[{"article","title","text","url"}]` uses BM25 over
  `normalize`d tokens.
- `POST /api/ai/ask/` answers only from the retrieved articles and cites them.
- `/ai/agreement/` swaps its static citations for `top_k(terms)`.
- [ ] **Step 1:** Implement. Check "Mediativ kelishuv bajarilmasa nima boʻladi?" → the answer cites the right article.
- [ ] **Step 2:** Pitch docs: `progress.md`, AI-8 → `Tayyor`. Commit `feat(ai): law q&a with bm25 retrieval`, then push.

### B16: Freeze — final deploy and pitch-docs pass (P0, deadline −1:00)

- [ ] **Step 1:** `npm run build` (only one build at a time). Deploy. Run the demo script from `00-overview.md` on
  the Netlify URL with a phone-sized context at 390 px and a desktop. Fix only blockers.
- [ ] **Step 2:** Update `docs/pitch/01-…` and `02-…` so they match what was built:
  - FT-1 says "demo: login/parol, production: SMS";
  - FT-3 (hujjat yuklash) is marked `Keyin`, because it is not in this plan;
  - every built row reads `Tayyor`;
  - the 8 % / 40–80 % figures read "masala shartida keltirilgan", with the verified numbers next to them.
  - Refresh `links.md` and `research.md`.
- [ ] **Step 3:** Commit `docs(pitch): final state for the demo`, then push. Tell the user what is live and what is mocked.
