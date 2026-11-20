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
  AskAnswer,
  Brief,
  Case,
  CaseStatus,
  Classification,
  Comparison,
  DisputeType,
  InvitePublic,
  LoginResponse,
  Mediator,
  Meeting,
  RoomMessage,
  RoomParty,
  Position,
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
  vazirlik: { password: "vazirlik123", user: { id: "u-vazirlik", name: "Adliya vazirligi", role: "ministry" } },
  admin: { password: "admin123", user: { id: "u-admin", name: "Administrator", role: "admin" } },
};

const STORE_KEY = "ma.mock.cases.v1";
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
  scheduled: "Mediator bilan sessiya belgilandi",
  agreed: "Kelishuvga erishildi",
  closed: "Ish yopildi",
};

function now() {
  return new Date().toISOString();
}

function setStatus(c: Case, status: CaseStatus) {
  if (c.status === status) return;
  c.status = status;
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

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => CYR[ch] ?? ch)
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
  approvals: Record<string, Partial<Record<RoomParty, { decision: "approved" | "changes"; comment: string; at: string; hash: string }>>>;
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
    return x ? { decision: x.decision, comment: x.comment, at: x.at, current: !!h && x.hash === h } : null;
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
    r.approvals[c.id] = {
      ...(r.approvals[c.id] ?? {}),
      [viewer]: { decision: body.decision as "approved", comment: String(body.comment ?? ""), at: now(), hash: agreementHash(c.agreement) },
    };
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
  if (user.role === "mediator") return cases.filter((c) => c.mediator?.id === "m-01");
  return cases;
}

export async function mockRoute<T>({ method, path, body, user }: Req): Promise<T> {
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  const p = path.replace(/\?.*$/, "");
  const query = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
  const b = (body ?? {}) as Record<string, unknown>;
  const ok = (x: unknown) => x as T;

  if (p === "/health") return ok({ ok: true, ai: false });

  if (p === "/auth/login/" || p === "/auth/login") {
    const u = DEMO_USERS[String(b.username ?? "").trim().toLowerCase()];
    if (!u || u.password !== b.password) throw new MockError(400, "Login yoki parol notoʻgʻri");
    return ok({ token: `mock-${u.user.id}`, user: u.user } satisfies LoginResponse);
  }
  if (p === "/auth/me/" || p === "/auth/me") {
    if (!user) throw new MockError(401, "Avval tizimga kiring");
    return ok(user);
  }

  if (p === "/mediators/") {
    const type = query.get("dispute_type");
    const region = query.get("region");
    const lang = query.get("lang");
    return ok(
      mediators
        .filter((m) => (!type || m.specialties.includes(type as DisputeType)) && (!region || m.region === region) && (!lang || m.languages.includes(lang as "uz")))
        .sort((a, c) => c.rating - a.rating),
    );
  }

  if (p === "/stats/") return ok(statsFx as Stats);

  if (p.startsWith("/rooms/")) {
    const all = load();
    const t = p.match(/^\/rooms\/t\/([^/]+)\/(.*)$/);
    if (t) {
      const c = all.find((x) => x.invite_token === t[1]);
      if (!c) throw new MockError(404, "Taklif topilmadi yoki muddati oʻtgan");
      return ok(roomRoute(method, t[2], c, "respondent", b, query));
    }
    const mt = p.match(/^\/rooms\/meetings\/([^/]+)\/$/);
    const caseId = mt ? loadRooms().meetings.find((m) => m.id === mt[1])?.caseId : p.split("/")[2];
    const c = all.find((x) => x.id === caseId);
    if (!c || !user) throw new MockError(404, "Ish topilmadi");
    const viewer = user.role === "mediator" || user.role === "admin" ? "mediator" : "claimant";
    return ok(roomRoute(method, mt ? `meetings/${mt[1]}/` : p.split("/").slice(3).join("/"), c, viewer, b, query));
  }

  const cases = load();

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
      events: [{ kind: "created", label: EVENT_LABEL.new, at: t }],
      created_at: t,
      updated_at: t,
    };
    if (inviteText) setStatus(c, "invited");
    save([c, ...cases]);
    return ok(c);
  }

  const caseMatch = p.match(/^\/cases\/([^/]+)\/(book\/)?$/);
  if (caseMatch) {
    const c = cases.find((x) => x.id === caseMatch[1]);
    if (!c) throw new MockError(404, "Ish topilmadi");
    if (caseMatch[2]) {
      c.mediator = mediators.find((m) => m.id === b.mediator_id) ?? mediators[0];
      c.session_at = String(b.session_at ?? now());
      setStatus(c, "scheduled");
    } else if (method === "PATCH") {
      const { status, ...rest } = b as Partial<Case>;
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
