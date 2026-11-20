import type { CaseStatus, DisputeType, Region, Role } from "./types";

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
};

export const STATUS_TONE: Record<CaseStatus, "ink" | "warn" | "accord" | "seal" | "stop" | "muted"> = {
  new: "ink",
  invited: "warn",
  accepted: "seal",
  declined: "stop",
  scheduled: "seal",
  agreed: "accord",
  closed: "muted",
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
  ministry: "Vazirlik",
  admin: "Administrator",
};

export const ROLE_HOME: Record<Role, string> = {
  claimant: "/ishlar",
  mediator: "/mediator",
  ministry: "/vazirlik",
  admin: "/vazirlik",
};

export const LANG_LABEL: Record<string, string> = { uz: "Oʻzbek", ru: "Rus", en: "Ingliz" };

export const REGIONS = Object.keys(REGION_LABEL) as Region[];
export const DISPUTE_TYPES = Object.keys(DISPUTE_LABEL) as DisputeType[];
