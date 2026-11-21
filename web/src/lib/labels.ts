import type { Area, CaseStatus, DisputeType, Lang, Region, Role } from "./types";

export const DISPUTE_LABEL: Record<DisputeType, string> = {
  qarz: "Qarz",
  ijara: "Ijara",
  oilaviy: "Oilaviy",
  istemolchi: "Isteʼmolchi huquqi",
  mehnat: "Mehnat",
  qoshnichilik: "Qoʻshnichilik",
  boshqa: "Boshqa",
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "Yangi",
  invited: "Taklif yuborildi",
  accepted: "Rozi boʻldi",
  declined: "Rad etildi",
  scheduled: "Sessiya belgilandi",
  agreed: "Kelishuv",
  closed: "Yopildi",
  terminated: "Tugatildi",
};

export const STATUS_TONE: Record<CaseStatus, "ink" | "warn" | "accord" | "seal" | "stop" | "muted"> = {
  new: "ink",
  invited: "warn",
  accepted: "seal",
  declined: "stop",
  scheduled: "seal",
  agreed: "accord",
  closed: "muted",
  terminated: "muted",
};

export const REGION_LABEL: Record<Region, string> = {
  "toshkent-sh": "Toshkent shahri",
  "toshkent-v": "Toshkent viloyati",
  andijon: "Andijon",
  fargona: "Fargʻona",
  namangan: "Namangan",
  samarqand: "Samarqand",
  buxoro: "Buxoro",
  navoiy: "Navoiy",
  qashqadaryo: "Qashqadaryo",
  surxondaryo: "Surxondaryo",
  jizzax: "Jizzax",
  sirdaryo: "Sirdaryo",
  xorazm: "Xorazm",
  qoraqalpogiston: "Qoraqalpogʻiston",
};

export const ROLE_LABEL: Record<Role, string> = {
  claimant: "Murojaatchi",
  mediator: "Mediator",
  admin: "Administrator",
};

export const ROLE_HOME: Record<Role, string> = {
  claimant: "/ishlar",
  mediator: "/mediator",
  admin: "/",
};

/** Paths each role may open. Used to ignore a `?next=` that belongs to another role. */
const ROLE_PATHS: Record<Role, RegExp> = {
  claimant: /^\/(ishlar|murojaat|mediatorlar|huquq)(\/|$)/,
  mediator: /^\/(mediator|huquq)(\/|$)|^\/ishlar\/[^/]+\/kelishuv$/,
  admin: /^\//,
};

export function homeFor(role: Role, next?: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && ROLE_PATHS[role].test(next) ? next : ROLE_HOME[role];
}

export const LANG_LABEL: Record<Lang, string> = {
  uz: "Oʻzbek",
  ru: "Rus",
  en: "Ingliz",
  kaa: "Qoraqalpoq",
  tr: "Turk",
  tg: "Tojik",
  kk: "Qozoq",
  ky: "Qirgʻiz",
  tk: "Turkman",
};
export const LANGS = Object.keys(LANG_LABEL) as Lang[];

/** Mediation areas from Art. 3 of the Law "On Mediation" (registry column "ixtisoslashgan mediatsiya sohasi"). */
export const AREA_LABEL: Record<Area, string> = {
  fuqarolik: "Fuqarolik",
  tadbirkorlik: "Tadbirkorlik",
  bank: "Bank va mijoz",
  sugurta: "Sugʻurta",
  mehnat: "Mehnat",
  oilaviy: "Oilaviy",
};
export const AREAS = Object.keys(AREA_LABEL) as Area[];
export function areaOf(t: DisputeType): Area {
  return t === "mehnat" || t === "oilaviy" ? t : "fuqarolik";
}

export const REGIONS = Object.keys(REGION_LABEL) as Region[];
export const DISPUTE_TYPES = Object.keys(DISPUTE_LABEL) as DisputeType[];
