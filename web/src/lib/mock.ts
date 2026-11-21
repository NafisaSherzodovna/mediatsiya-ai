// Mock backend: serves contract/fixtures and keeps created/changed cases in
// localStorage, so the whole demo flow works without the Django server.
// Also used as the stage fallback when a live AI call fails.

import agreementFx from "@/fixtures/agreement.json";
import aiInviteFx from "@/fixtures/ai-invite.json";
import askFx from "@/fixtures/ask.json";
import briefFx from "@/fixtures/brief.json";
import casesFx from "@/fixtures/cases.json";
import classifyFx from "@/fixtures/classify.json";
import compareFx from "@/fixtures/compare.json";
import mediatorsFx from "@/fixtures/mediators.json";
import statsFx from "@/fixtures/stats.json";
import type {
  Agreement,
  AiInvite,
  Area,
  AskAnswer,
  Brief,
  Case,
  CaseStatus,
  Classification,
  Comparison,
  DisputeType,
  InvitePublic,
  Lang,
  LoginResponse,
  Mediator,
  Meeting,
  RoomMessage,
  RoomParty,
  Position,
  Procedure,
  Region,
  Stats,
  User,
} from "./types";
import { DISPUTE_LABEL } from "./labels";
import { som } from "./format";

export class MockError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
  }
}

const DEMO_USERS: Record<string, { password: string; user: User }> = {
  ariza: { password: "ariza123", user: { id: "u-ariza", name: "Aziz Karimov", role: "claimant" } },
  mediator: { password: "mediator123", user: { id: "u-mediator", name: "Dilnoza Rahimova", role: "mediator" } },
  admin: { password: "admin123", user: { id: "u-admin", name: "Administrator", role: "admin" } },
};

const STORE_KEY = "ma.mock.cases.v4"; // v4: procedure agreement, term, termination, signatories
const USERS_KEY = "ma.mock.users.v1";
const mediators = mediatorsFx as Mediator[];

function load(): Case[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Case[];
  } catch {
    /* fall through to fixtures */
  }
  return structuredClone(casesFx as Case[]);
}

function save(cases: Case[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(cases));
  } catch {
    /* ignore */
  }
}

type MockAccount = { password: string; user: User };

function loadUsers(): Record<string, MockAccount> {
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "{}") as Record<string, MockAccount>;
  } catch {
    return {};
  }
}

const COMMISSION_RATE = 0.1; // same as backend cases.models.COMMISSION_RATE

function payment(fee: number): Case["payment"] {
  const commission = Math.round(fee * COMMISSION_RATE);
  return { fee_uzs: fee, commission_uzs: commission, mediator_payout_uzs: fee - commission, claimant_share_uzs: fee - Math.floor(fee / 2), respondent_share_uzs: Math.floor(fee / 2), claimant_paid_at: null, respondent_paid_at: null, status: "pending" };
}

function event(c: Case, kind: string, label: string) {
  c.events = [...c.events, { kind, label, at: now() }];
  c.updated_at = now();
}

// ---------- the procedure under the Law (mirror of backend cases/procedure.py) ----------

const TERM_DAYS = 30;
const LANG_NAME: Record<string, string> = { uz: "oʻzbek", ru: "rus", en: "ingliz", kaa: "qoraqalpoq", tr: "turk", tg: "tojik", kk: "qozoq", ky: "qirgʻiz", tk: "turkman" };
const ddmmyyyy = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" });

function mockTerms(c: Case, m: Mediator, language: Lang, start: string): Procedure {
  const fee = m.price_uzs;
  const deadline = new Date(new Date(start).getTime() + TERM_DAYS * 86_400_000).toISOString();
  const subject = c.classification?.summary || c.description;
  const amount = c.amount_uzs ? `, ${som(c.amount_uzs)}` : "";
  const clauses: [string, string][] = [
    ["1. Taraflar", `Murojaatchi: ${c.claimant.name}. Ikkinchi tomon: ${c.respondent.name || "—"}. Taraflar mediatsiyada shaxsan yoki vakili orqali ishtirok etadi (10-modda).`],
    ["2. Nizo predmeti", `${DISPUTE_LABEL[c.dispute_type]}${amount}: ${subject.slice(0, 400)}`],
    ["3. Mediator", `${m.name}, Adliya vazirligi Mediatorlar reyestri № ${m.registry_no}. Mediator mustaqil va xolis; mustaqilligiga taʼsir qiluvchi holat yuzaga kelsa, bu haqda taraflarga aytadi va mediatsiyadan voz kechadi (9, 13-moddalar).`],
    ["4. Tartib-taomil tartibi", "Mediator taraflar bilan birgalikda va har biri bilan alohida uchrashuvlar oʻtkazadi, ogʻzaki va yozma tavsiyalar beradi (13-modda). Muloqot Murosa platformasidagi maxfiy suhbat va uchrashuvlar orqali olib boriladi. Yarashishga majburlash taqiqlanadi (7-modda)."],
    ["5. Til va joy", `Mediatsiya ${LANG_NAME[language] ?? language} tilida oʻtkaziladi. Joy: onlayn, Murosa platformasi; yuzma-yuz uchrashuv kelishilsa, mediator manzili: ${m.address || "kelishiladi"}.`],
    ["6. Sana va muddat", `Mediatsiya ${ddmmyyyy(start)} kuni, ushbu kelishuv tuzilgan kundan boshlanadi (19-modda) va ${ddmmyyyy(deadline)} gacha (${TERM_DAYS} kun) tugallanishi kerak. Taraflarning oʻzaro roziligi bilan muddat bir marta ${TERM_DAYS} kungacha uzaytirilishi mumkin; muddat oʻtsa, mediatsiya tugatiladi (23, 24-moddalar). Mediatsiya davomida daʼvo muddatining oʻtishi toʻxtatib turiladi (21-modda).`],
    ["7. Taraflarning huquqlari", "Har bir taraf mediatordan va mediatsiyaning istalgan bosqichida unda ishtirok etishdan voz kechishga haqli (7, 11-moddalar). Mediativ kelishuvga erishilsa, u yozma shaklda tuziladi, taraflar imzolaydi va mediator tasdiqlaydi; u majburiy kuchga ega, ixtiyoriy bajarilmasa sudga murojaat qilinadi (29, 29¹-moddalar)."],
    ["8. Maxfiylik", "Mediatsiya davomida maʼlum boʻlgan maʼlumotlar uni bergan tarafning yozma roziligisiz oshkor qilinmaydi. Mediator bir tarafdan olgan maʼlumotni ikkinchi tarafga faqat uning roziligi bilan aytadi (6, 26, 27-moddalar)."],
    ["9. Xarajatlar", `Mediator haqi ${som(fee)}; taraflar teng ulushda, ${som(fee - Math.floor(fee / 2))} va ${som(Math.floor(fee / 2))} dan toʻlaydi (28-modda). Pul Murosa platformasi hisobida saqlanadi; mediativ kelishuv tuzilgach, ${COMMISSION_RATE * 100} % platforma xizmat haqi ushlab qolinib, qolgani mediatorga oʻtkaziladi. Mediator mediatsiyani rad etsa yoki taraf mediatordan voz kechsa, toʻlangan pul toʻliq qaytariladi. Mediatsiya kelishuvsiz tugatilsa: ikkala ulush toʻlangan va kamida bitta uchrashuv oʻtkazilgan boʻlsa, haq mediatorga oʻtkaziladi, aks holda toʻliq qaytariladi.`],
  ];
  return {
    title: `Mediatsiya tartib-taomilini amalga oshirish toʻgʻrisidagi kelishuv № ${c.code}`,
    language,
    started_at: start,
    deadline,
    clauses: clauses.map(([title, body]) => ({ title, body })),
    note: "Taraflar ushbu kelishuvga platformada elektron rozilik bildirgan: murojaatchi mediatorni taklif qilib, ikkinchi tomon uni tasdiqlab.",
  };
}

function clearProcedure(c: Case) {
  Object.assign(c, { procedure: null, procedure_deadline: null, extension_requested_by: "", extended: false });
}

const TERMINATED_LABEL: Record<string, string> = {
  claimant: "Murojaatchi mediatsiyani tugatdi",
  respondent: "Ikkinchi tomon mediatsiyani tugatdi",
  mediator: "Mediator: kelishuvga erishish imkoni yoʻq, mediatsiya tugatildi",
  expired: "Mediatsiya muddati oʻtdi, mediatsiya tugatildi (23, 24-moddalar)",
};
const CAN_TERMINATE: Record<string, CaseStatus[]> = {
  claimant: ["new", "invited", "accepted", "scheduled"],
  respondent: ["accepted", "scheduled"],
  mediator: ["scheduled"],
};

/** Art. 7, 24 and clause 9 of the procedure agreement. */
function terminateCase(c: Case, by: string, reason = "") {
  if (by !== "expired" && !CAN_TERMINATE[by].includes(c.status)) throw new MockError(400, "Bu bosqichda mediatsiyani tugatib boʻlmaydi");
  const p = c.payment;
  const paidAny = !!(p?.claimant_paid_at || p?.respondent_paid_at);
  const held = loadRooms().meetings.some((m) => m.caseId === c.id && m.status === "accepted" && new Date(m.start).getTime() < Date.now());
  const keep = !!(p?.claimant_paid_at && p?.respondent_paid_at) && held;
  if (paidAny && !keep) c.payment = null;
  if (keep && p) p.status = "released";
  if (c.procedure?.draft) c.procedure = null; // an unconfirmed proposal never became an agreement
  Object.assign(c, { proposed_mediator: null, proposed_session_at: null, extension_requested_by: "", termination_reason: reason.slice(0, 300), status: "terminated" });
  event(c, `terminated_${by}`, TERMINATED_LABEL[by]);
  if (paidAny) event(c, keep ? "paid_out" : "refunded", keep ? "Uchrashuv oʻtkazilgani uchun mediator haqi mediatorga oʻtkazildi" : "Toʻlangan mediator haqi tomonlarga qaytarildi");
}

function expireDue(cases: Case[]): boolean {
  let changed = false;
  for (const c of cases) {
    if (c.status === "scheduled" && c.procedure_deadline && new Date(c.procedure_deadline).getTime() < Date.now()) {
      terminateCase(c, "expired");
      changed = true;
    }
  }
  return changed;
}

/** Art. 23: one party asks, the other agrees; once, by 30 days. */
function extendTerm(c: Case, party: RoomParty) {
  if (c.status !== "scheduled" || !c.procedure_deadline) throw new MockError(400, "Muddatni faqat mediatsiya davomida uzaytirish mumkin");
  if (c.extended) throw new MockError(400, "Muddat allaqachon bir marta uzaytirilgan");
  if (c.extension_requested_by === party) throw new MockError(400, "Siz allaqachon soʻragansiz, ikkinchi tomon roziligi kutilmoqda");
  if (c.extension_requested_by) {
    c.procedure_deadline = new Date(new Date(c.procedure_deadline).getTime() + TERM_DAYS * 86_400_000).toISOString();
    Object.assign(c, { extended: true, extension_requested_by: "" });
    if (c.procedure) c.procedure = { ...c.procedure, deadline: c.procedure_deadline, extended: true };
    event(c, "extended", "Taraflar roziligi bilan muddat 30 kunga uzaytirildi (23-modda)");
  } else {
    c.extension_requested_by = party;
    event(c, `extension_requested_${party}`, party === "claimant" ? "Murojaatchi muddatni 30 kunga uzaytirishni soʻradi" : "Ikkinchi tomon muddatni 30 kunga uzaytirishni soʻradi");
  }
}

/** Art. 8, 22: the respondent confirms or rejects the claimant's proposed mediator. */
function answerProposal(c: Case, mediatorId: string, accept: boolean) {
  if (c.status !== "accepted" || !c.proposed_mediator) throw new MockError(400, "Tasdiqlanadigan mediator taklifi yoʻq");
  if (c.proposed_mediator.id !== mediatorId) throw new MockError(409, "Mediator taklifi oʻzgardi, sahifani yangilang");
  if (accept) {
    c.mediator = c.proposed_mediator;
    c.session_at = c.proposed_session_at;
    c.payment = payment(c.mediator.price_uzs);
    c.procedure = mockTerms(c, c.mediator, c.procedure?.language ?? "uz", now());
    c.procedure_deadline = c.procedure.deadline;
    Object.assign(c, { extension_requested_by: "", extended: false });
    c.proposed_mediator = null;
    c.proposed_session_at = null;
    setStatus(c, "scheduled");
  } else {
    c.proposed_mediator = null;
    c.proposed_session_at = null;
    c.procedure = null;
    event(c, "mediator_rejected", "Ikkinchi tomon taklif qilingan mediatorni rad etdi");
  }
}

/** Art. 11: a party refuses the mediator: refund, wipe the room (Art. 6, 27), back to "accepted". */
function dropMediator(c: Case, party: RoomParty | "mediator") {
  if (c.status !== "scheduled" || !c.mediator) throw new MockError(400, "Mediatordan faqat kelishuv imzolanguncha voz kechish mumkin");
  const paid = !!(c.payment?.claimant_paid_at || c.payment?.respondent_paid_at);
  const r = loadRooms();
  r.messages = r.messages.filter((m) => m.caseId !== c.id);
  r.meetings = r.meetings.filter((m) => m.caseId !== c.id);
  delete r.approvals[c.id];
  saveRooms(r);
  Object.assign(c, { mediator: null, session_at: null, payment: null, brief: null, agreement: null, status: "accepted" });
  clearProcedure(c);
  c.signatories = { claimant: null, respondent: null };
  event(c, `mediator_dropped_${party}`, { claimant: "Murojaatchi mediatordan voz kechdi", respondent: "Ikkinchi tomon mediatordan voz kechdi", mediator: "Mediator ishni rad etdi (9, 13-moddalar)" }[party]);
  if (paid) event(c, "refunded", "Toʻlangan mediator haqi tomonlarga qaytarildi");
}

function payShare(c: Case, party: RoomParty) {
  const p = c.payment;
  if (!p || c.status !== "scheduled") throw new MockError(400, "Toʻlov faqat mediatsiya davomida qabul qilinadi");
  const key = party === "claimant" ? "claimant_paid_at" : "respondent_paid_at";
  if (p[key]) throw new MockError(400, "Bu ulush allaqachon toʻlangan");
  p[key] = now();
  if (p.claimant_paid_at && p.respondent_paid_at) p.status = "held"; // paying is only possible while scheduled
  c.events = [...c.events, { kind: `paid_${party}`, label: party === "claimant" ? "Murojaatchi mediator haqining ulushini toʻladi" : "Ikkinchi tomon mediator haqining ulushini toʻladi", at: now() }];
  c.updated_at = now();
}

const PHONES_KEY = "ma.mock.phones.v1";
const phoneKey = (s: string) => s.replace(/\D/g, "").slice(-9);
function loadPhones(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(PHONES_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
function savePhones(p: Record<string, string>) {
  try {
    window.localStorage.setItem(PHONES_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function resetMock() {
  try {
    window.localStorage.removeItem(STORE_KEY);
    window.localStorage.removeItem(ROOMS_KEY);
  } catch {
    /* ignore */
  }
}

const EVENT_LABEL: Record<CaseStatus, string> = {
  new: "Murojaat yaratildi",
  invited: "Ikkinchi tomonga taklif yuborildi",
  accepted: "Ikkinchi tomon rozi boʻldi",
  declined: "Ikkinchi tomon rad etdi",
  scheduled: "Ikkinchi tomon mediatorni tasdiqladi, sessiya belgilandi",
  agreed: "Kelishuvga erishildi",
  closed: "Ish yopildi",
  terminated: "Mediatsiya tugatildi",
};

function now() {
  return new Date().toISOString();
}

function setStatus(c: Case, status: CaseStatus) {
  if (c.status === status) return;
  c.status = status;
  if (status === "agreed" && c.payment?.status === "held") c.payment.status = "released";
  c.events = [...c.events, { kind: status, label: EVENT_LABEL[status], at: now() }];
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

// ---------- tiny rule-based "AI" for mock mode ----------

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "ʼ", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "oʻ", қ: "q", ғ: "gʻ", ҳ: "h",
};

// The new Uzbek alphabet maps back to the classic spelling the keyword rules use.
const YANGI_BACK: Record<string, string> = { ş: "sh", ç: "ch", ğ: "gʻ", ö: "oʻ" };

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => CYR[ch] ?? YANGI_BACK[ch] ?? ch)
    .join("")
    .replace(/['‘’`ʼ]/g, "ʻ");
}

const RULES: [DisputeType, RegExp][] = [
  ["ijara", /ijara|kvartira|uy egasi|ijarachi/],
  ["qarz", /qarz|pul berib|qaytarmayapti|qaytarmadi/],
  ["oilaviy", /ajrash|aliment|turmush|er-xotin|qaynona/],
  ["mehnat", /ish haqi|maosh|ishdan|ish beruvchi|oylik/],
  ["istemolchi", /doʻkon|dokon|mahsulot|xizmat|kafolat|qaytarish|buzuq/],
  ["qoshnichilik", /qoʻshni|qoshni/],
];
const CRIMINAL = /urdi|kaltak|oʻgʻirla|ogirla|pichoq|zoʻrla|oʻldir|giyohvand|tahdid/;

function amountFrom(t: string): number | null {
  const mln = t.match(/(\d+(?:[.,]\d+)?)\s*(mln|million|миллион)/);
  if (mln) return Math.round(parseFloat(mln[1].replace(",", ".")) * 1_000_000);
  const plain = t.replace(/[\s ]/g, "").match(/\d{5,}/);
  return plain ? Number(plain[0]) : null;
}

export function mockClassify(text: string): Classification {
  const t = normalize(text);
  const type = RULES.find(([, re]) => re.test(t))?.[0] ?? "boshqa";
  const criminal = CRIMINAL.test(t);
  const amount = amountFrom(t);
  if (type === "ijara" && !criminal && /3 oy/.test(t)) return { ...(classifyFx as Classification), source: "fallback" };
  return {
    dispute_type: type,
    mediable: !criminal,
    reason: criminal
      ? "Bu holat jinoyat belgilariga ega. Mediatsiya qoʻllanmaydi — ichki ishlar organlari yoki prokuraturaga murojaat qiling."
      : `${DISPUTE_LABEL[type]} boʻyicha fuqarolik nizosi. Mediatsiya toʻgʻrisidagi qonun bunday nizolarga qoʻllanadi.`,
    summary: text.length > 140 ? `${text.slice(0, 137)}…` : text,
    amount_uzs: amount,
    confidence: type === "boshqa" ? 0.55 : 0.84,
    source: "fallback",
  };
}

function mockCompare(amount: number | null): Comparison {
  const base = compareFx as Comparison;
  if (!amount) return { ...base, source: "fallback" };
  const duty = Math.max(Math.round(amount * 0.05), 412_000);
  const lawyer = 1_000_000;
  const mediator = 600_000;
  return {
    ...base,
    court: {
      ...base.court,
      cost_uzs: duty + lawyer,
      items: [
        { label: "Davlat boji (taxminiy)", uzs: duty },
        { label: "Advokat xizmati (taxminiy)", uzs: lawyer },
      ],
    },
    mediation: { ...base.mediation, cost_uzs: mediator, items: [{ label: "Mediator haqi (2 sessiya, taxminiy)", uzs: mediator }] },
    source: "fallback",
  };
}

function mockInvite(b: { claimant_name: string; respondent_name: string; dispute_type: DisputeType; amount_uzs: number | null }): AiInvite {
  const first = b.respondent_name.split(" ")[0] || "hurmatli qoʻshnim";
  const topic = DISPUTE_LABEL[b.dispute_type].toLowerCase();
  const sum = b.amount_uzs ? ` (${som(b.amount_uzs)})` : "";
  return {
    text: `Assalomu alaykum, ${first}. Oramizdagi ${topic} masalasini${sum} sudga bormasdan, betaraf mediator yordamida tinch hal qilishni taklif qilaman. Bu ikkalamiz uchun ham tezroq va arzonroq, kelishuv shartlarini esa birga belgilaymiz. Rozi boʻlsangiz, havola orqali javob bering. Hurmat bilan, ${b.claimant_name}.`,
    checks: (aiInviteFx as AiInvite).checks,
    source: "fallback",
  };
}

function mockPosition(answers: { q: string; a: string }[]): Position {
  const [situation, wants, offer] = answers.map((x) => x.a.trim()).concat(["", "", ""]);
  return {
    wants: wants ? [wants] : ["Masalani tinch hal qilish"],
    can_offer: offer ? [offer] : ["Muzokaraga tayyor"],
    concerns: situation ? [situation.length > 90 ? `${situation.slice(0, 87)}…` : situation] : [],
    summary: [situation, wants && `Xohlaydi: ${wants}.`, offer && `Taklif: ${offer}.`].filter(Boolean).join(" ") || "Tomon muzokaraga tayyor.",
    source: "fallback",
  };
}

// ---------- rooms (chat, meetings, approvals) ----------

type RoomsStore = {
  messages: (RoomMessage & { caseId: string; readM: boolean; readP: boolean })[];
  meetings: (Meeting & { caseId: string })[];
  approvals: Record<string, Partial<Record<RoomParty, { decision: "approved" | "changes"; comment: string; at: string; hash: string; full_name?: string; address?: string }>>>;
};
const ROOMS_KEY = "ma.mock.rooms.v1";

function loadRooms(): RoomsStore {
  try {
    const raw = window.localStorage.getItem(ROOMS_KEY);
    if (raw) return JSON.parse(raw) as RoomsStore;
  } catch {
    /* fresh */
  }
  return { messages: [], meetings: [], approvals: {} };
}
function saveRooms(r: RoomsStore) {
  try {
    window.localStorage.setItem(ROOMS_KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
}

function agreementHash(a: Agreement | null): string {
  return a ? JSON.stringify({ t: a.title, c: a.clauses }) : "";
}

function approvalsOf(r: RoomsStore, c: Case) {
  const h = agreementHash(c.agreement);
  const a = r.approvals[c.id] ?? {};
  const one = (p: RoomParty) => {
    const x = a[p];
    return x ? { decision: x.decision, comment: x.comment, at: x.at, current: !!h && x.hash === h, full_name: x.full_name ?? "", address: x.address ?? "" } : null;
  };
  return { claimant: one("claimant"), respondent: one("respondent") };
}

export function mockBothApproved(c: Case): boolean {
  const s = approvalsOf(loadRooms(), c);
  return [s.claimant, s.respondent].every((x) => x && x.current && x.decision === "approved");
}

function roomOf(c: Case, viewer: "mediator" | RoomParty) {
  const r = loadRooms();
  const parties: RoomParty[] = viewer === "mediator" ? ["claimant", "respondent"] : [viewer];
  const names = { claimant: c.claimant.name, respondent: c.respondent.name || "Ikkinchi tomon" };
  return {
    case_id: c.id,
    code: c.code,
    status: c.status,
    viewer,
    mediator: c.mediator ? { name: c.mediator.name, registry_no: c.mediator.registry_no } : null,
    names,
    threads: parties.map((p) => {
      const msgs = r.messages.filter((m) => m.caseId === c.id && m.party === p);
      const unread = msgs.filter((m) => (viewer === "mediator" ? m.sender !== "mediator" && !m.readM : m.sender === "mediator" && !m.readP)).length;
      const last = msgs.at(-1);
      return { party: p, name: names[p], unread, last: last ?? null };
    }),
    meetings: r.meetings.filter((m) => m.caseId === c.id && parties.includes(m.party) && m.status !== "cancelled"),
    agreement: c.agreement,
    agreement_hash: agreementHash(c.agreement),
    approvals: approvalsOf(r, c),
    payment: c.payment,
    proposed_mediator: c.proposed_mediator,
    proposed_session_at: c.proposed_session_at,
    procedure: c.procedure,
    procedure_deadline: c.procedure_deadline,
    extended: c.extended,
    extension_requested_by: c.extension_requested_by,
    termination_reason: c.termination_reason,
    signatories: c.signatories,
  };
}

function roomRoute(method: string, rest: string, c: Case, viewer: "mediator" | RoomParty, body: Record<string, unknown>, query: URLSearchParams): unknown {
  const r = loadRooms();
  if (rest === "") return roomOf(c, viewer);
  if (rest === "messages/") {
    if (!c.mediator) throw new MockError(403, "Mediator hali tayinlanmagan");
    const party = (viewer === "mediator" ? (query.get("party") ?? body.party) : viewer) as RoomParty;
    if (method === "POST") {
      const text = String(body.text ?? "").trim();
      if (!text) throw new MockError(400, "Xabar boʻsh");
      const m = { id: uid(), caseId: c.id, party, sender: viewer, text, at: now(), readM: viewer === "mediator", readP: viewer !== "mediator" };
      r.messages.push(m);
      saveRooms(r);
      return m;
    }
    const list = r.messages.filter((m) => m.caseId === c.id && m.party === party);
    list.forEach((m) => (viewer === "mediator" ? (m.readM = true) : (m.readP = true)));
    saveRooms(r);
    return list;
  }
  if (rest === "meetings/" && method === "POST") {
    if (viewer !== "mediator") throw new MockError(403, "Uchrashuvni faqat mediator belgilaydi");
    const start = new Date(String(body.start));
    const minutes = Number(body.minutes ?? 45);
    if (Number.isNaN(start.getTime())) throw new MockError(400, "Tomon va vaqtni tanlang");
    if (start.getTime() < Date.now()) throw new MockError(400, "Oʻtib ketgan vaqtni tanlab boʻlmaydi");
    const end = start.getTime() + minutes * 60_000;
    const other = r.meetings.find((m) => {
      if (m.status === "declined" || m.status === "cancelled") return false;
      const st = new Date(m.start).getTime();
      return st < end && st + m.minutes * 60_000 > start.getTime();
    });
    if (other) {
      const who = other.party === "claimant" ? "murojaatchi" : "ikkinchi tomon";
      throw new MockError(409, `Bu vaqtda ${who} bilan uchrashuv bor. Boshqa vaqt tanlang.`);
    }
    const m = {
      id: uid(),
      caseId: c.id,
      party: body.party as RoomParty,
      start: start.toISOString(),
      minutes,
      mode: (body.mode as "online" | "ofis") ?? "online",
      place: String(body.place ?? ""),
      note: String(body.note ?? ""),
      status: "proposed" as const,
    };
    r.meetings.push(m);
    r.messages.push({ id: uid(), caseId: c.id, party: m.party, sender: "mediator", text: "Uchrashuv taklif qilindi. Iltimos, tasdiqlang.", at: now(), readM: true, readP: false });
    saveRooms(r);
    return m;
  }
  const mm = rest.match(/^meetings\/([^/]+)\/$/);
  if (mm) {
    const m = r.meetings.find((x) => x.id === mm[1] && x.caseId === c.id);
    if (!m) throw new MockError(404, "Uchrashuv topilmadi");
    const status = body.status as Meeting["status"];
    if (viewer === "mediator") {
      if (status !== "cancelled") throw new MockError(400, "Mediator faqat bekor qila oladi");
    } else if (m.status !== "proposed") throw new MockError(400, "Bu uchrashuvga allaqachon javob berilgan");
    m.status = status;
    saveRooms(r);
    return m;
  }
  if (rest === "approve/") {
    if (viewer === "mediator") throw new MockError(403, "Kelishuvni faqat tomonlar tasdiqlaydi");
    if (!c.agreement) throw new MockError(400, "Kelishuv loyihasi hali yoʻq");
    const fullName = String(body.full_name ?? "").split(/\s+/).filter(Boolean).join(" ");
    const address = String(body.address ?? "").trim();
    if (body.decision === "approved" && (fullName.split(" ").length < 3 || address.length < 10))
      throw new MockError(400, "Familiya, ism, otasining ismi va yashash joyi (pochta manzili) kerak (29-modda)");
    r.approvals[c.id] = {
      ...(r.approvals[c.id] ?? {}),
      [viewer]: { decision: body.decision as "approved", comment: String(body.comment ?? ""), at: now(), hash: agreementHash(c.agreement), full_name: fullName, address },
    };
    c.signatories = { ...c.signatories, [viewer]: body.decision === "approved" ? { full_name: fullName, address } : null };
    r.messages.push({
      id: uid(),
      caseId: c.id,
      party: viewer,
      sender: viewer,
      text: body.decision === "approved" ? "Kelishuv loyihasini tasdiqladi." : `Kelishuvga oʻzgartirish soʻradi: ${String(body.comment || "—")}`,
      at: now(),
      readM: false,
      readP: true,
    });
    saveRooms(r);
    return { approvals: approvalsOf(r, c) };
  }
  throw new MockError(404, "Topilmadi");
}

// ---------- router ----------

type Req = { method: string; path: string; body?: unknown; user: User | null };

function byRole(cases: Case[], user: User | null): Case[] {
  if (!user) return [];
  if (user.role === "claimant") return cases.filter((c) => c.claimant.id === user.id);
  if (user.role === "mediator") return user.id === "u-mediator" ? cases.filter((c) => c.mediator?.id === "m-01") : [];
  return cases;
}

export async function mockRoute<T>({ method, path, body, user }: Req): Promise<T> {
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  const p = path.replace(/\?.*$/, "");
  const query = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
  const b = (body ?? {}) as Record<string, unknown>;
  const ok = (x: unknown) => x as T;

  if (p === "/health") return ok({ ok: true, ai: false });

  if (p === "/auth/register/" || p === "/auth/register") {
    const username = String(b.username ?? "").trim();
    const key = username.toLowerCase();
    const role = b.role === "mediator" ? "mediator" : "claimant"; // never admin
    if (!/^[A-Za-z0-9_.]{3,30}$/.test(username) || String(b.password ?? "").length < 6 || String(b.full_name ?? "").trim().length < 3)
      throw new MockError(400, "Tekshiring: login, parol (kamida 6 belgi), F.I.Sh.");
    const users = loadUsers();
    if (DEMO_USERS[key] || users[key]) throw new MockError(400, "Bu login band, boshqasini tanlang");
    const account = { password: String(b.password), user: { id: `u-${key}`, name: String(b.full_name).trim(), role, pending: role === "mediator" } satisfies User };
    users[key] = account;
    savePhones({ ...loadPhones(), [account.user.id]: String(b.phone ?? "").trim() });
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
      /* ignore */
    }
    return ok({ token: `mock-${account.user.id}`, user: account.user } satisfies LoginResponse);
  }
  if (p === "/auth/login/" || p === "/auth/login") {
    const name = String(b.username ?? "").trim().toLowerCase();
    const u = DEMO_USERS[name] ?? loadUsers()[name];
    if (!u || u.password !== b.password) throw new MockError(400, "Login yoki parol notoʻgʻri");
    return ok({ token: `mock-${u.user.id}`, user: u.user } satisfies LoginResponse);
  }
  if (p === "/auth/me/" || p === "/auth/me") {
    if (!user) throw new MockError(401, "Avval tizimga kiring");
    const phones = loadPhones();
    if (method === "PATCH") {
      const phone = String(b.phone ?? "").trim();
      if (!/^\+?[0-9 ()-]{9,20}$/.test(phone)) throw new MockError(400, "Telefon raqamini toʻgʻri kiriting");
      phones[user.id] = phone;
      savePhones(phones);
    }
    return ok({ ...user, phone: phones[user.id] ?? (user.id === "u-ariza" ? "+998901234567" : "") });
  }

  if (p === "/mediators/") {
    const area = query.get("area");
    const region = query.get("region");
    const lang = query.get("lang");
    const text = (query.get("q") ?? "").trim().toLowerCase();
    const rows = mediators
      .filter((m) => (!area || m.areas.includes(area as Area)) && (!region || m.region === region) && (!lang || m.languages.includes(lang as Lang)))
      .filter((m) => !text || `${m.name} ${m.registry_no}`.toLowerCase().includes(text))
      .sort((a, c) => c.rating - a.rating || c.resolved - a.resolved);
    if (!query.get("page")) return ok(rows);
    const size = Math.min(Math.max(Number(query.get("page_size")) || 10, 1), 50);
    const pages = Math.max(Math.ceil(rows.length / size), 1);
    const page = Math.min(Math.max(Number(query.get("page")) || 1, 1), pages);
    return ok({ count: rows.length, page, pages, results: rows.slice((page - 1) * size, page * size) });
  }

  if (p === "/stats/") return ok(statsFx as Stats);

  if (p.startsWith("/rooms/")) {
    const all = load();
    if (expireDue(all)) save(all);
    const t = p.match(/^\/rooms\/t\/([^/]+)\/(.*)$/);
    if (t) {
      const c = all.find((x) => x.invite_token === t[1]);
      if (!c) throw new MockError(404, "Taklif topilmadi yoki muddati oʻtgan");
      if (["pay/", "mediator/", "drop-mediator/", "terminate/", "extend/"].includes(t[2])) {
        if (t[2] === "pay/") payShare(c, "respondent");
        else if (t[2] === "mediator/") answerProposal(c, String(b.mediator_id ?? ""), !!b.accept);
        else if (t[2] === "terminate/") terminateCase(c, "respondent", String(b.reason ?? ""));
        else if (t[2] === "extend/") extendTerm(c, "respondent");
        else dropMediator(c, "respondent");
        save(all);
        return ok(roomOf(c, "respondent"));
      }
      if (method !== "GET" && c.status === "terminated") throw new MockError(403, "Mediatsiya tugatilgan");
      const res = roomRoute(method, t[2], c, "respondent", b, query);
      if (method !== "GET") save(all);
      return ok(res);
    }
    const mt = p.match(/^\/rooms\/meetings\/([^/]+)\/$/);
    const caseId = mt ? loadRooms().meetings.find((m) => m.id === mt[1])?.caseId : p.split("/")[2];
    const c = all.find((x) => x.id === caseId);
    if (!c || !user) throw new MockError(404, "Ish topilmadi");
    const viewer = user.role === "mediator" || user.role === "admin" ? "mediator" : "claimant";
    const rest = mt ? `meetings/${mt[1]}/` : p.split("/").slice(3).join("/");
    if (rest === "terminate/" || rest === "refuse/" || rest === "extend/") {
      if (rest === "refuse/") {
        if (viewer !== "mediator") throw new MockError(403, "Faqat ishning mediatori");
        dropMediator(c, "mediator");
        save(all);
        return ok({ ok: true });
      }
      if (rest === "extend/") {
        if (viewer !== "claimant") throw new MockError(403, "Muddatni taraflar uzaytiradi");
        extendTerm(c, "claimant");
      } else terminateCase(c, viewer, String(b.reason ?? ""));
      save(all);
      return ok(roomOf(c, viewer));
    }
    if (method !== "GET" && c.status === "terminated" && !mt) throw new MockError(403, "Mediatsiya tugatilgan");
    const res = roomRoute(method, rest, c, viewer, b, query);
    if (method !== "GET") save(all);
    return ok(res);
  }

  const cases = load();
  if (expireDue(cases)) save(cases);

  if (p === "/my-invites/") {
    if (!user) throw new MockError(401, "Avval tizimga kiring");
    const key = phoneKey(loadPhones()[user.id] ?? "");
    if (key.length < 9) return ok([]);
    return ok(
      cases
        .filter((c) => c.claimant.id !== user.id && phoneKey(c.respondent.phone) === key)
        .map((c) => ({ code: c.code, claimant_name: c.claimant.name, dispute_type: c.dispute_type, status: c.status, invite_token: c.invite_token, created_at: c.created_at })),
    );
  }
  if (p === "/cases/" && method === "GET") return ok(byRole(cases, user).sort((a, c) => c.created_at.localeCompare(a.created_at)));
  if (p === "/cases/" && method === "POST") {
    if (!user) throw new MockError(401, "Avval tizimga kiring");
    const n = cases.length + 41;
    const t = now();
    const inviteText = String(b.invite_text ?? "");
    const c: Case = {
      id: uid(),
      code: `MD-2026-${String(n).padStart(4, "0")}`,
      status: "new",
      dispute_type: (b.dispute_type as DisputeType) ?? "boshqa",
      region: (b.region as Region) ?? "toshkent-sh",
      amount_uzs: (b.amount_uzs as number | null) ?? null,
      description: String(b.description ?? ""),
      claimant: { id: user.id, name: user.name, phone: "+998901234567" },
      respondent: (b.respondent as Case["respondent"]) ?? { name: "", phone: "" },
      invite_token: uid().replace(/-/g, ""),
      classification: (b.classification as Classification) ?? null,
      comparison: (b.comparison as Comparison) ?? null,
      invite_text: inviteText,
      claimant_position: (b.claimant_position as Position) ?? null,
      respondent_position: null,
      brief: null,
      mediator: null,
      session_at: null,
      agreement: null,
      agreed_at: null,
      review: null,
      payment: null,
      proposed_mediator: null,
      proposed_session_at: null,
      procedure: null,
      procedure_deadline: null,
      extended: false,
      extension_requested_by: "",
      termination_reason: "",
      signatories: { claimant: null, respondent: null },
      events: [{ kind: "created", label: EVENT_LABEL.new, at: t }],
      created_at: t,
      updated_at: t,
    };
    if (inviteText) setStatus(c, "invited");
    save([c, ...cases]);
    return ok(c);
  }

  const caseMatch = p.match(/^\/cases\/([^/]+)\/(book\/|pay\/|review\/|drop-mediator\/)?$/);
  if (caseMatch) {
    const c = cases.find((x) => x.id === caseMatch[1]);
    if (!c) throw new MockError(404, "Ish topilmadi");
    if (caseMatch[2] === "pay/") {
      payShare(c, "claimant");
    } else if (caseMatch[2] === "drop-mediator/") {
      dropMediator(c, "claimant");
    } else if (caseMatch[2] === "review/") {
      const stars = Number(b.stars);
      if (!c.mediator || (c.status !== "agreed" && c.status !== "closed")) throw new MockError(400, "Baho faqat ish yakunlangandan keyin qoʻyiladi");
      if (c.review) throw new MockError(400, "Bu ish uchun baho allaqachon qoʻyilgan");
      if (!Number.isInteger(stars) || stars < 0 || stars > 5) throw new MockError(400, "Notoʻgʻri maʼlumot: stars");
      c.review = { stars, comment: String(b.comment ?? "").trim(), at: now() };
      const m = c.mediator;
      m.rating = Math.round(((m.rating * m.reviews + stars) / (m.reviews + 1)) * 100) / 100;
      m.reviews += 1;
      c.events = [...c.events, { kind: "reviewed", label: "Murojaatchi mediatorni baholadi", at: now() }];
    } else if (caseMatch[2]) {
      if (c.status !== "accepted") throw new MockError(400, "Mediatorni ikkinchi tomon rozi boʻlgandan keyin taklif qilish mumkin");
      const m = mediators.find((x) => x.id === b.mediator_id);
      if (!m) throw new MockError(404, "Bu mediator hozir mavjud emas");
      const lang = (String(b.language || "") || (m.languages.includes("uz") ? "uz" : m.languages[0])) as Lang;
      if (!m.languages.includes(lang)) throw new MockError(400, "Mediator bu tilda mediatsiya oʻtkazmaydi");
      c.proposed_mediator = m;
      c.proposed_session_at = String(b.session_at ?? now());
      c.procedure = { ...mockTerms(c, m, lang, now()), draft: true };
      event(c, "mediator_proposed", "Murojaatchi mediatorni taklif qildi");
    } else if (method === "PATCH") {
      const { status, ...rest } = b as Partial<Case>;
      if (status === "agreed" && c.status !== "scheduled") throw new MockError(400, "Kelishuvni faqat mediatsiya davom etayotganda muhrlash mumkin");
      if (status === "agreed" && !mockBothApproved({ ...c, ...rest } as Case)) throw new MockError(400, "Ikkala tomon kelishuv loyihasini tasdiqlamagan");
      Object.assign(c, rest);
      if (status) setStatus(c, status);
      if (status === "agreed") c.agreed_at = now();
    }
    c.updated_at = now();
    save(cases);
    return ok(c);
  }

  const inviteMatch = p.match(/^\/invite\/([^/]+)\/(respond\/)?$/);
  if (inviteMatch) {
    const c = cases.find((x) => x.invite_token === inviteMatch[1]);
    if (!c) throw new MockError(404, "Taklif topilmadi yoki muddati oʻtgan");
    if (inviteMatch[2]) {
      setStatus(c, b.accept ? "accepted" : "declined");
      c.respondent_position = (b.position as Position) ?? null;
      c.updated_at = now();
      save(cases);
      return ok({ status: c.status });
    }
    return ok({
      code: c.code,
      claimant_name: c.claimant.name,
      dispute_type: c.dispute_type,
      amount_uzs: c.amount_uzs,
      invite_text: c.invite_text,
      status: c.status,
    } satisfies InvitePublic);
  }

  // ---- AI ----
  if (p === "/ai/classify/") {
    const text = String(b.text ?? "");
    if (text.trim().length < 20) throw new MockError(400, "Nizoni batafsilroq yozing");
    return ok(mockClassify(text));
  }
  if (p === "/ai/compare/") return ok(mockCompare((b.amount_uzs as number | null) ?? null));
  if (p === "/ai/invite/") return ok(mockInvite(b as Parameters<typeof mockInvite>[0]));
  if (p === "/ai/position/") return ok(mockPosition((b.answers as { q: string; a: string }[]) ?? []));
  if (p === "/ai/brief/") return ok({ ...(briefFx as Brief), source: "fallback" });
  if (p === "/ai/agreement/") {
    const a = structuredClone(agreementFx as Agreement);
    a.title = `Mediativ kelishuv № ${String(b.code ?? "MD-2026-0042")}`;
    a.clauses[0].body = `${String(b.claimant_name ?? "Aziz Karimov")} va ${String(b.respondent_name ?? "Bekzod Umarov")}, mediator ishtirokida.`;
    const terms = (b.terms as string[] | undefined) ?? [];
    if (terms.length) a.clauses[2] = { title: "3. Kelishilgan shartlar", body: terms.join("; ") + "." };
    return ok({ ...a, source: "fallback" });
  }
  if (p === "/ai/transcribe/") return ok({ text: "Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million soʻm boʻldi.", source: "fallback" });
  if (p === "/ai/ask/") return ok({ ...(askFx as AskAnswer), source: "fallback" });

  if (p === "/demo/reset/") {
    resetMock();
    return ok({ ok: true, cases: (casesFx as Case[]).length });
  }

  throw new MockError(404, "Topilmadi");
}
