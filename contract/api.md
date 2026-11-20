# API contract (source of truth)

Both roles code against this file and `contract/fixtures/*.json`. B's frontend runs on the fixtures
(mock mode) until A's backend is live, so nobody waits.

Change rules:
- Additive changes only: a new field, a new endpoint, or a new enum value. Make them in a separate commit
  whose message starts with `[contract]`, and update the matching fixture in the same commit.
- Renames and removals need the user's OK first.

Base path: `/api/`. Everything is JSON except `/api/ai/transcribe`, which takes multipart.

Auth:
- The token goes in the header `Authorization: Token <token>`.
- Public endpoints are marked **public**.

Errors:
- Errors return `{ "detail": "<Uzbek message>" }` with HTTP 400, 401, 403 or 404.

## Enums

| Name | Values |
|---|---|
| `DisputeType` | `qarz`, `ijara`, `oilaviy`, `istemolchi`, `mehnat`, `qoshnichilik`, `boshqa` |
| `CaseStatus` | `new`, `invited`, `accepted`, `declined`, `scheduled`, `agreed`, `closed` |
| `Role` | `claimant`, `mediator`, `ministry`, `admin` |
| `Region` | `toshkent-sh`, `toshkent-v`, `andijon`, `fargona`, `namangan`, `samarqand`, `buxoro`, `navoiy`, `qashqadaryo`, `surxondaryo`, `jizzax`, `sirdaryo`, `xorazm`, `qoraqalpogiston` |
| `AiSource` | `ai` (model answered), `fallback` (rule or template answer) |

Uzbek labels for the enums live in `web/src/lib/labels.ts` (B) and in Django `choices` (A). The labels must match.

Status flow: `new → invited → accepted | declined`, then `accepted → scheduled → agreed → closed`.

## Shared objects

```ts
type Classification = { dispute_type: DisputeType; mediable: boolean; reason: string; summary: string;
  amount_uzs: number | null; confidence: number /*0..1*/; source: AiSource };
type CostItem = { label: string; uzs: number };
type Track = { days_min: number; days_max: number; cost_uzs: number; items: CostItem[] };
type Comparison = { court: Track; mediation: Track; notes: string[]; sources: { title: string; url: string }[]; source: AiSource };
type Position = { wants: string[]; can_offer: string[]; concerns: string[]; summary: string; source: AiSource };
type Brief = { facts: string[]; claimant_wants: string[]; respondent_wants: string[]; common_ground: string[];
  zopa: string; suggested_options: string[]; risks: string[]; source: AiSource };
type Citation = { article: string; title: string; url: string };
type Agreement = { title: string; clauses: { title: string; body: string }[]; citations: Citation[]; source: AiSource };
type Mediator = { id: string; name: string; photo: string; registry_no: string; specialties: DisputeType[];
  languages: ("uz" | "ru" | "en")[]; region: Region; price_uzs: number; rating: number; sessions: number;
  years: number; bio: string; is_demo: boolean };
type CaseEvent = { kind: string; label: string; at: string /*ISO*/ };
type Case = { id: string; code: string /*"MD-2026-0042"*/; status: CaseStatus; dispute_type: DisputeType;
  region: Region; amount_uzs: number | null; description: string;
  claimant: { id: string; name: string; phone: string }; respondent: { name: string; phone: string };
  invite_token: string; classification: Classification | null; comparison: Comparison | null;
  invite_text: string; claimant_position: Position | null; respondent_position: Position | null;
  brief: Brief | null; mediator: Mediator | null; session_at: string | null; agreement: Agreement | null;
  agreed_at: string | null; events: CaseEvent[]; created_at: string; updated_at: string };
type User = { id: string; name: string; role: Role };
```

## Core endpoints (owner: A)

| Method and path | Auth | Request → response |
|---|---|---|
| `GET /api/health` | public | → `{ ok: true, ai: boolean }` (`ai` = Gemini keys configured) |
| `POST /api/auth/login` | public | `{ username, password }` → `{ token, user: User }`; wrong pair → 400 `{detail:"Login yoki parol notoʻgʻri"}` |
| `GET /api/auth/me` | token | → `User` |
| `GET /api/cases/` | token | → `Case[]`, newest first, max 50. Claimant sees own cases, mediator sees assigned ones, ministry and admin see all |
| `POST /api/cases/` | token (claimant) | `{ description, dispute_type, region, amount_uzs, respondent, classification, comparison, invite_text, claimant_position? }` → `Case` (`status` = `invited` when `invite_text` is non-empty, else `new`; server makes `code` and `invite_token`; adds event `created`, plus `invited` when invited) |
| `GET /api/cases/{id}/` | token | → `Case` |
| `PATCH /api/cases/{id}/` | token | any of `status, classification, comparison, invite_text, claimant_position, brief, agreement, region, amount_uzs, respondent` → `Case`; setting `agreement` with `status:"agreed"` also sets `agreed_at`; each status change adds an event |
| `POST /api/cases/{id}/book/` | token | `{ mediator_id, session_at }` → `Case` (`status` → `scheduled`, event `scheduled`) |
| `GET /api/invite/{token}/` | public | → `{ code, claimant_name, dispute_type, amount_uzs, invite_text, status }` |
| `POST /api/invite/{token}/respond/` | public | `{ accept: boolean, position: Position \| null }` → `{ status }` (`accepted` or `declined`; saves `respondent_position`; event) |
| `GET /api/mediators/` | public | query `dispute_type`, `region`, `lang` (all optional) → `Mediator[]`, rating desc |
| `GET /api/stats/` | token (ministry, admin) | → `Stats` (below) |

```ts
type Stats = { totals: { cases: number; agreed: number; agreement_rate: number /*0..1*/; avg_days: number;
    refunded_fees_uzs: number; mediators_active: number };
  by_type: { type: DisputeType; count: number; agreed: number }[];
  by_region: { region: Region; count: number; agreed: number }[];
  monthly: { month: string /*"2026-01"*/; cases: number; agreed: number }[] };
```

Demo accounts (A creates them in a data migration; the passwords are public on purpose, demo only):

| username | password | role | name |
|---|---|---|---|
| `ariza` | `ariza123` | claimant | Aziz Karimov |
| `mediator` | `mediator123` | mediator | Dilnoza Rahimova (linked to mediator `m-01`) |
| `vazirlik` | `vazirlik123` | ministry | Adliya vazirligi |
| `admin` | `admin123` | admin (Django superuser) | Administrator |

## AI endpoints (owner: B, Django app `backend/ai/`, all **public**, stateless, rate-limited)

Every AI endpoint answers within 20 s. When the model fails or no key is set, it returns a rule or template
answer with `source: "fallback"`. It never returns 5xx for a model failure.

| Method and path | Request → response |
|---|---|
| `POST /api/ai/transcribe/` | multipart `audio` (webm, ogg, mp4 or wav, ≤ 60 s) → `{ text, source }` |
| `POST /api/ai/classify/` | `{ text }` (min 20 chars, else 400 `{detail:"Nizoni batafsilroq yozing"}`) → `Classification` |
| `POST /api/ai/compare/` | `{ dispute_type, amount_uzs }` → `Comparison` (numbers come from `backend/ai/data/costs.json`; the model only writes `notes`) |
| `POST /api/ai/invite/` | `{ claimant_name, respondent_name, dispute_type, amount_uzs, summary }` → `{ text, checks: string[], source }` |
| `POST /api/ai/position/` | `{ role: "claimant" \| "respondent", summary, answers: { q: string; a: string }[] }` → `Position` |
| `POST /api/ai/brief/` | `{ summary, dispute_type, amount_uzs, claimant_position, respondent_position }` → `Brief` |
| `POST /api/ai/agreement/` | `{ code, claimant_name, respondent_name, dispute_type, amount_uzs, brief, terms: string[], summary?: string }` → `Agreement` (`summary` = the claimant's own description, so the model keeps the roles right) |
| `POST /api/ai/ask/` | `{ question }` → `{ answer, citations: Citation[], source }` |

## Demo endpoint (owner: B, app `backend/demo/`)

| Method and path | Auth | Request → response |
|---|---|---|
| `POST /api/demo/reset/` | header `X-Demo-Key: <DEMO_RESET_KEY env>` | → `{ ok: true, cases: number }` (wipes cases and re-seeds) |

## Fixtures

`contract/fixtures/` holds one example response per shape. The frontend's mock mode serves them, and
backend serializers must produce the same shape:
`login.json`, `case.json`, `cases.json`, `invite.json`, `mediators.json`, `stats.json`, `classify.json`,
`compare.json`, `ai-invite.json`, `position.json`, `brief.json`, `agreement.json`, `ask.json`.
