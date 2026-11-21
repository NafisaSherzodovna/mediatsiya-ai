// Copied from contract/api.md. Additive changes only, via a [contract] commit.

export type DisputeType = "qarz" | "ijara" | "oilaviy" | "istemolchi" | "mehnat" | "qoshnichilik" | "boshqa";
export type CaseStatus = "new" | "invited" | "accepted" | "declined" | "scheduled" | "agreed" | "closed" | "terminated";
export type Role = "claimant" | "mediator" | "admin";
export type Region =
  | "toshkent-sh"
  | "toshkent-v"
  | "andijon"
  | "fargona"
  | "namangan"
  | "samarqand"
  | "buxoro"
  | "navoiy"
  | "qashqadaryo"
  | "surxondaryo"
  | "jizzax"
  | "sirdaryo"
  | "xorazm"
  | "qoraqalpogiston";
export type AiSource = "ai" | "fallback";
export type Area = "fuqarolik" | "tadbirkorlik" | "bank" | "sugurta" | "mehnat" | "oilaviy";
export type Lang = "uz" | "ru" | "en" | "kaa" | "tr" | "tg" | "kk" | "ky" | "tk";

export type Classification = {
  dispute_type: DisputeType;
  mediable: boolean;
  reason: string;
  summary: string;
  amount_uzs: number | null;
  confidence: number;
  source: AiSource;
};
export type CostItem = { label: string; uzs: number };
export type Track = { days_min: number; days_max: number; cost_uzs: number; items: CostItem[] };
export type Comparison = {
  court: Track;
  mediation: Track;
  notes: string[];
  sources: { title: string; url: string }[];
  source: AiSource;
};
export type Position = { wants: string[]; can_offer: string[]; concerns: string[]; summary: string; source: AiSource };
export type Brief = {
  facts: string[];
  claimant_wants: string[];
  respondent_wants: string[];
  common_ground: string[];
  zopa: string;
  suggested_options: string[];
  risks: string[];
  source: AiSource;
};
export type Citation = { article: string; title: string; url: string };
export type Agreement = {
  title: string;
  clauses: { title: string; body: string }[];
  citations: Citation[];
  source: AiSource;
};
export type Mediator = {
  id: string;
  name: string;
  photo: string;
  registry_no: string;
  registry_date: string | null;
  areas: Area[];
  languages: Lang[];
  address: string;
  phone: string;
  email: string;
  certificate_no: string;
  certificate_date: string | null;
  region: Region;
  price_uzs: number;
  rating: number;
  sessions: number;
  years: number;
  bio: string;
  is_demo: boolean;
  resolved: number;
  reviews: number;
};
export type MediatorPage = { count: number; page: number; pages: number; results: Mediator[] };
export type CaseEvent = { kind: string; label: string; at: string };
export type Case = {
  id: string;
  code: string;
  status: CaseStatus;
  dispute_type: DisputeType;
  region: Region;
  amount_uzs: number | null;
  description: string;
  claimant: { id: string; name: string; phone: string };
  respondent: { name: string; phone: string };
  invite_token: string;
  classification: Classification | null;
  comparison: Comparison | null;
  invite_text: string;
  claimant_position: Position | null;
  respondent_position: Position | null;
  brief: Brief | null;
  mediator: Mediator | null;
  session_at: string | null;
  agreement: Agreement | null;
  agreed_at: string | null;
  events: CaseEvent[];
  created_at: string;
  updated_at: string;
  review: Review | null;
  payment: Payment | null;
  proposed_mediator: Mediator | null;
  proposed_session_at: string | null;
} & ProcedureState;
/** Art. 19, 20, 23, 24, 29: the procedure agreement, its term, why it ended, and who signed the agreement. */
export type ProcedureState = {
  procedure: Procedure | null;
  procedure_deadline: string | null;
  extended: boolean;
  extension_requested_by: "" | RoomParty;
  termination_reason: string;
  signatories: Record<RoomParty, { full_name: string; address: string } | null>;
};
export type Procedure = {
  title: string;
  language: Lang;
  started_at: string;
  deadline: string;
  clauses: { title: string; body: string }[];
  note: string;
  draft?: true;
  extended?: true;
};
export type Review = { stars: number; comment: string; at: string };
export type Payment = {
  fee_uzs: number;
  commission_uzs: number;
  mediator_payout_uzs: number;
  claimant_share_uzs: number;
  respondent_share_uzs: number;
  claimant_paid_at: string | null;
  respondent_paid_at: string | null;
  status: "pending" | "held" | "released";
};
export type User = { id: string; name: string; role: Role; pending?: boolean };
export type LoginResponse = { token: string; user: User };
export type InvitePublic = {
  code: string;
  claimant_name: string;
  dispute_type: DisputeType;
  amount_uzs: number | null;
  invite_text: string;
  status: CaseStatus;
};
/** An invitation addressed to the signed-in user's phone (GET /api/my-invites/). */
export type MyInvite = { code: string; claimant_name: string; dispute_type: DisputeType; status: CaseStatus; invite_token: string; created_at: string };
export type Me = User & { phone: string };
export type Stats = {
  totals: {
    cases: number;
    agreed: number;
    agreement_rate: number;
    avg_days: number;
    refunded_fees_uzs: number;
    mediators_active: number;
  };
  by_type: { type: DisputeType; count: number; agreed: number }[];
  by_region: { region: Region; count: number; agreed: number }[];
  monthly: { month: string; cases: number; agreed: number }[];
};
export type AiInvite = { text: string; checks: string[]; source: AiSource };
export type AskAnswer = { answer: string; citations: Citation[]; source: AiSource };

// ---- rooms (contract/api.md, "Rooms") ----
export type RoomParty = "claimant" | "respondent";
export type RoomMessage = { id: number | string; party: RoomParty; sender: "mediator" | RoomParty; text: string; at: string };
export type MeetingStatus = "proposed" | "accepted" | "declined" | "cancelled";
export type Meeting = {
  id: string;
  party: RoomParty;
  start: string;
  minutes: number;
  mode: "online" | "ofis";
  place: string;
  note: string;
  status: MeetingStatus;
};
export type ApprovalState = { decision: "approved" | "changes"; comment: string; at: string; current: boolean; full_name: string; address: string } | null;
export type Room = {
  case_id: string;
  code: string;
  status: CaseStatus;
  viewer: "mediator" | RoomParty;
  mediator: { name: string; registry_no: string } | null;
  names: Record<RoomParty, string>;
  threads: { party: RoomParty; name: string; unread: number; last: RoomMessage | null }[];
  meetings: Meeting[];
  agreement: Agreement | null;
  agreement_hash: string;
  approvals: Record<RoomParty, ApprovalState>;
  payment: Payment | null;
  proposed_mediator: Mediator | null;
  proposed_session_at: string | null;
} & ProcedureState;
