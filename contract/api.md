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
| `CaseStatus` | `new`, `invited`, `accepted`, `declined`, `scheduled`, `agreed`, `closed`, `terminated` (ended without an agreement, Art. 24) |
| `Role` | `claimant`, `mediator`, `admin` (`ministry` removed 2026-11-21 at the user's request; stats are public now) |
| `Region` | `toshkent-sh`, `toshkent-v`, `andijon`, `fargona`, `namangan`, `samarqand`, `buxoro`, `navoiy`, `qashqadaryo`, `surxondaryo`, `jizzax`, `sirdaryo`, `xorazm`, `qoraqalpogiston` |
| `AiSource` | `ai` (model answered), `fallback` (rule or template answer) |
| `Area` | `fuqarolik`, `tadbirkorlik`, `bank`, `sugurta`, `mehnat`, `oilaviy` — mediation areas from Art. 3 of the Law (the registry's "ixtisoslashgan mediatsiya sohasi"). Dispute type → area: `mehnat`→`mehnat`, `oilaviy`→`oilaviy`, the rest → `fuqarolik` |
| `Lang` | `uz`, `ru`, `en`, `kaa` (qoraqalpoq), `tr`, `tg`, `kk`, `ky`, `tk` |

Uzbek labels for the enums live in `web/src/lib/labels.ts` (B) and in Django `choices` (A). The labels must match.

Status flow: `new → invited → accepted | declined`, then `accepted → scheduled → agreed → closed`. Any of `new, invited, accepted, scheduled` → `terminated` (a party withdraws, the mediator ends it, or the term expires). `scheduled → accepted` when a party drops the mediator or the mediator refuses.

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
type Agreement = { title: string; clauses: { title: string; body: string }[]; citations: Citation[]; source: AiSource | "mediator" /*the mediator writes it; POST /ai/agreement/ is no longer used by the web*/ };
// Fields follow the Ministry of Justice mediator registry (Art. 9³). `specialties` was removed 2026-11-21 (user request).
type Mediator = { id: string; name: string; photo: string; registry_no: string; registry_date: string | null /*YYYY-MM-DD*/;
  areas: Area[]; languages: Lang[]; address: string; phone: string; email: string;
  certificate_no: string; certificate_date: string | null /*special training course document*/;
  region: Region; price_uzs: number; rating: number; sessions: number;
  years: number; bio: string; is_demo: boolean;
  resolved: number /*cases closed with an agreement*/; reviews: number /*star ratings behind rating*/ };
type CaseEvent = { kind: string; label: string; at: string /*ISO*/ };
type Case = { id: string; code: string /*"MD-2026-0042"*/; status: CaseStatus; dispute_type: DisputeType;
  region: Region; amount_uzs: number | null; description: string;
  claimant: { id: string; name: string; phone: string }; respondent: { name: string; phone: string };
  invite_token: string; classification: Classification | null; comparison: Comparison | null;
  invite_text: string; claimant_position: Position | null; respondent_position: Position | null;
  brief: Brief | null; mediator: Mediator | null; session_at: string | null; agreement: Agreement | null;
  agreed_at: string | null; events: CaseEvent[]; created_at: string; updated_at: string;
  review: Review | null; payment: Payment | null;
  proposed_mediator: Mediator | null; proposed_session_at: string | null /*claimant's proposal waiting for the respondent*/;
  procedure: Procedure | null; procedure_deadline: string | null; extended: boolean; extension_requested_by: "" | RoomParty;
  termination_reason: string; signatories: Record<RoomParty, { full_name: string; address: string } | null> };
// Art. 19, 20: the written procedure agreement. A fixed template (not AI). While a mediator is only proposed it is a
// preview (`draft: true`, start = now); the respondent's confirmation freezes it and starts the 30-day term (Art. 23).
type Procedure = { title: string; language: Lang; started_at: string; deadline: string; clauses: { title: string; body: string }[];
  note: string; draft?: true; extended?: true };
type User = { id: string; name: string; role: Role; pending: boolean /*mediator waiting for admin approval*/ };
type Review = { stars: number /*0..5*/; comment: string; at: string };
// Demo escrow: the fee is snapshotted when the respondent confirms the mediator and split 50/50 (odd soʻm → claimant), Art. 28.
// The money goes to the platform account; the platform keeps commission_uzs (10 %) and pays mediator_payout_uzs to the mediator.
// pending = not both halves paid; held = both paid, waiting for the agreement; released = paid out to the mediator.
type Payment = { fee_uzs: number; commission_uzs: number; mediator_payout_uzs: number; claimant_share_uzs: number; respondent_share_uzs: number;
  claimant_paid_at: string | null; respondent_paid_at: string | null; status: "pending" | "held" | "released" };
```

## Core endpoints (owner: A)

| Method and path | Auth | Request → response |
|---|---|---|
| `GET /api/health` | public | → `{ ok: true, ai: boolean }` (`ai` = Gemini keys configured) |
| `POST /api/auth/login` | public | `{ username, password }` → `{ token, user: User }`; wrong pair → 400 `{detail:"Login yoki parol notoʻgʻri"}` |
| `POST /api/auth/register` | public | `{ role: "claimant"\|"mediator", username, password (≥6), full_name, phone, mediator?: { registry_no, registry_date, areas, languages, region, address, email, certificate_no, certificate_date, price_uzs, years, bio?, declaration: true } }` (`declaration` = the Art. 12 requirements: higher education, not a civil servant, no criminal record, legal capacity; dates may not be in the future) → 201 `{ token, user: User }`. Username is unique ignoring case (400 `{detail:"Bu login band, boshqasini tanlang"}`). A mediator starts unapproved (`user.pending = true`) and is hidden from `/api/mediators/` until the admin ticks "Tasdiqlangan" |
| `GET /api/auth/me` | token | → `User & { phone: string }` |
| `PATCH /api/auth/me` | token | `{ phone }` → `User & { phone }`; creates the profile for admin-made users. 400 `{detail:"Telefon raqamini toʻgʻri kiriting"}` |
| `GET /api/my-invites/` | token | → `{ code, claimant_name, dispute_type, status, invite_token, created_at }[]` (max 20): cases whose respondent phone matches the user's phone (last 9 digits), excluding the user's own. Phones are not verified yet (SMS: FT-1) |
| `GET /api/cases/` | token | → `Case[]`, newest first, max 50. Claimant sees own cases, mediator sees assigned ones, admin sees all |
| `POST /api/cases/` | token (claimant) | `{ description, dispute_type, region, amount_uzs, respondent, classification, comparison, invite_text, claimant_position? }` → `Case` (`status` = `invited` when `invite_text` is non-empty, else `new`; server makes `code` and `invite_token`; adds event `created`, plus `invited` when invited) |
| `GET /api/cases/{id}/` | token | → `Case` |
| `PATCH /api/cases/{id}/` | token | any of `status, classification, comparison, invite_text, claimant_position, brief, agreement, region, amount_uzs, respondent` → `Case`; setting `agreement` with `status:"agreed"` also sets `agreed_at`; each status change adds an event |
| `POST /api/cases/{id}/book/` | token (the case's claimant) | `{ mediator_id, session_at, language? }` (`language` must be one of the mediator's; default `uz` if they have it) → `Case`. Only when `accepted`. **Proposes** the mediator (Art. 8, 22: the parties choose together): sets `proposed_mediator`/`proposed_session_at`, event `mediator_proposed`; status stays `accepted` until the respondent confirms |
| `POST /api/cases/{id}/drop-mediator/` | token (the case's claimant) | `{}` → `Case`. Only when `scheduled` (Art. 11). Refunds both halves, deletes the room's messages, meetings and approvals, clears `brief`/`agreement`, status → `accepted` |
| `POST /api/cases/{id}/pay/` | token (the case's claimant) | `{}` → `Case`; marks the claimant's half paid (demo, no card data is sent). 400 when no mediator yet or already paid |
| `POST /api/cases/{id}/review/` | token (the case's claimant) | `{ stars: 0..5, comment? }` → `Case`; once per case, only when `agreed`/`closed`. Updates the mediator's `rating` (running average) and `reviews` |
| `GET /api/invite/{token}/` | public | → `{ code, claimant_name, dispute_type, amount_uzs, invite_text, status }` |
| `POST /api/invite/{token}/respond/` | public | `{ accept: boolean, position: Position \| null }` → `{ status }` (`accepted` or `declined`; saves `respondent_position`; event) |
| `GET /api/mediators/` | public | query `area`, `region`, `lang`, `q` (name or registry no.; all optional) → approved, not removed from the registry `Mediator[]`, rating desc, then resolved desc. With `page` (and `page_size`, 1–50, default 10) → `{ count, page, pages, results: Mediator[] }` instead |
| `GET /api/stats/` | public | → `Stats` (below); shown on the landing page |

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
| `m02` … `m42` | `mediator123` | mediator | the other demo mediators, created by `seed_demo` (user `mNN` ↔ mediator `m-NN`) |
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

## Rooms (owner: B, app `backend/rooms/`): chat, meetings, agreement approval

A room exists once a mediator is booked. The mediator has a **separate private chat with each party**, proposes
**meetings per party**, and the two parties **approve the agreement draft** before the mediator can seal it.
- The mediator and the claimant use their token. The respondent uses the invite token, with no account (`/api/rooms/t/{token}/…`).
- A party sees only its own chat and its own meetings.

```ts
type RoomParty = "claimant" | "respondent";
type RoomMessage = { id: number; party: RoomParty; sender: "mediator" | RoomParty; text: string; at: string };
type Meeting = { id: string; party: RoomParty; start: string; minutes: number; mode: "online" | "ofis"; place: string; note: string;
  status: "proposed" | "accepted" | "declined" | "cancelled" };
type ApprovalState = { decision: "approved" | "changes"; comment: string; at: string; current: boolean; full_name: string; address: string } | null;
type Room = { case_id: string; code: string; status: CaseStatus; viewer: "mediator" | RoomParty;
  mediator: { name: string; registry_no: string } | null; names: Record<RoomParty, string>;
  threads: { party: RoomParty; name: string; unread: number; last: RoomMessage | null }[];
  meetings: Meeting[]; agreement: Agreement | null; agreement_hash: string;
  approvals: Record<RoomParty, ApprovalState>; payment: Payment | null;
  proposed_mediator: Mediator | null; proposed_session_at: string | null;
  procedure: Procedure | null; procedure_deadline: string | null; extended: boolean; extension_requested_by: "" | RoomParty;
  termination_reason: string; signatories: Case["signatories"] };
```

| Method and path | Who | Request → response |
|---|---|---|
| `GET /api/rooms/{case_id}/` | mediator, claimant | → `Room` |
| `GET /api/rooms/{case_id}/messages/?party=` | mediator (any party), claimant (own) | → `RoomMessage[]` (marks them read) |
| `POST /api/rooms/{case_id}/messages/` | same | `{ text, party? }` → `RoomMessage` |
| `POST /api/rooms/{case_id}/meetings/` | mediator | `{ party, start, minutes (15–180), mode, place, note }` → `Meeting` (`proposed`). 409 when it overlaps any live meeting of this mediator: `{detail:"Bu vaqtda … bilan uchrashuv bor …"}` |
| `POST /api/rooms/meetings/{id}/` | claimant: `{status:"accepted"\|"declined"}`; mediator: `{status:"cancelled"}` | → `Meeting` |
| `POST /api/rooms/{case_id}/approve/` | claimant | `{ decision: "approved"\|"changes", comment?, full_name, address }` → `{ approvals }`. Approving needs the full name (surname, name, patronymic: 3+ words) and a residence or postal address (Art. 29), else 400 |
| `POST /api/rooms/{case_id}/terminate/` | claimant (in `new/invited/accepted/scheduled`), the case's mediator (in `scheduled`) | `{ reason? }` → `Room`. Status → `terminated`. Money: kept for the mediator only if both halves were paid and an accepted meeting has already started; otherwise refunded |
| `POST /api/rooms/{case_id}/refuse/` | the case's mediator | `{}` → `{ ok }`. Art. 9, 13, 28: like drop-mediator (full refund, room wiped, status → `accepted`), event `mediator_dropped_mediator` |
| `POST /api/rooms/{case_id}/extend/` | claimant | `{}` → `Room`. Art. 23: the first call asks, the other party's call agrees and moves `procedure_deadline` by 30 days; once only |
| `GET /api/rooms/t/{token}/` | respondent | → `Room` |
| `GET\|POST /api/rooms/t/{token}/messages/` | respondent | as above |
| `POST /api/rooms/t/{token}/meetings/{id}/` | respondent | `{status}` → `Meeting` |
| `POST /api/rooms/t/{token}/approve/` | respondent | `{decision, comment?}` → `{approvals}` |
| `POST /api/rooms/t/{token}/pay/` | respondent | `{}` → `Room`; marks the respondent's half paid (demo) |
| `POST /api/rooms/t/{token}/mediator/` | respondent | `{ mediator_id, accept }` → `Room`. `accept:true` makes the proposal the case's mediator (status → `scheduled`, fee snapshot); `false` clears it (event `mediator_rejected`). 409 when `mediator_id` is no longer the current proposal |
| `POST /api/rooms/t/{token}/drop-mediator/` | respondent | `{}` → `Room`; same as the claimant's drop-mediator |
| `POST /api/rooms/t/{token}/terminate/` | respondent (in `accepted/scheduled`) | `{ reason? }` → `Room`; as above |
| `POST /api/rooms/t/{token}/extend/` | respondent | `{}` → `Room`; as above |

Rules:
- A meeting counts only once the party accepts it.
- An approval is `current:false` after the agreement text changes.
- Every case and room request first ends an expired mediation (`scheduled` past `procedure_deadline` → `terminated`). A `terminated` room is read-only (403).
- `PATCH /api/cases/{id}/ {status:"agreed"}` is allowed only from `scheduled`, and returns 400 `{detail:"Ikkala tomon kelishuv loyihasini tasdiqlamagan"}` unless both parties approved the current text.

## Demo endpoint (owner: B, app `backend/demo/`)

| Method and path | Auth | Request → response |
|---|---|---|
| `POST /api/demo/reset/` | header `X-Demo-Key: <DEMO_RESET_KEY env>` | → `{ ok: true, cases: number }` (wipes cases and re-seeds) |

## Fixtures

`contract/fixtures/` holds one example response per shape. The frontend's mock mode serves them, and
backend serializers must produce the same shape:
`login.json`, `case.json`, `cases.json`, `invite.json`, `mediators.json`, `stats.json`, `classify.json`,
`compare.json`, `ai-invite.json`, `position.json`, `brief.json`, `agreement.json`, `ask.json`.
