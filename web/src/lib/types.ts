// Copied from contract/api.md. Additive changes only, via a [contract] commit.

export type DisputeType = "qarz" | "ijara" | "oilaviy" | "istemolchi" | "mehnat" | "qoshnichilik" | "boshqa";
export type CaseStatus = "new" | "invited" | "accepted" | "declined" | "scheduled" | "agreed" | "closed";
export type Role = "claimant" | "mediator" | "ministry" | "admin";
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
  specialties: DisputeType[];
  languages: ("uz" | "ru" | "en")[];
  region: Region;
  price_uzs: number;
  rating: number;
  sessions: number;
  years: number;
  bio: string;
  is_demo: boolean;
};
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
};
export type User = { id: string; name: string; role: Role };
export type LoginResponse = { token: string; user: User };
export type InvitePublic = {
  code: string;
  claimant_name: string;
  dispute_type: DisputeType;
  amount_uzs: number | null;
  invite_text: string;
  status: CaseStatus;
};
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
