import { Info, Sparkles } from "lucide-react";
import { cn } from "cn";
import type { AiSource, CaseStatus } from "@/lib/types";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/labels";

/** Shows a quiet note only when the answer came from the rule/template fallback. */
export function AiSourceChip({ source, className }: { source: AiSource | undefined; className?: string }) {
  if (source === "fallback") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 rounded-full bg-warn-tint px-2.5 py-1 text-xs font-medium text-[#7a4f12]", className)}
        title="Model javob bermadi — qoidalar asosidagi zaxira javob koʻrsatildi"
      >
        <Info className="size-3.5" /> AI zaxira rejimi
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-accord-tint px-2.5 py-1 text-xs font-medium text-accord-strong", className)}>
      <Sparkles className="size-3.5" /> AI tahlili
    </span>
  );
}

const TONE: Record<string, string> = {
  ink: "bg-ink-wash text-ink",
  warn: "bg-warn-tint text-[#7a4f12]",
  accord: "bg-accord-tint text-accord-strong",
  seal: "bg-seal-tint text-seal",
  stop: "bg-stop-tint text-stop",
  muted: "bg-muted text-ink-soft",
};

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", TONE[STATUS_TONE[status]], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

const AVATAR_TINTS = ["#E3F2EF", "#E8EDF8", "#F6EBE4", "#FBF1DE", "#EEF0F5", "#EDE7F6"];
const AVATAR_INKS = ["#0B5F58", "#2E4FA3", "#9A4A2C", "#7A4F12", "#1B2A4A", "#5B3E96"];

/** Initials on a tinted disc. Never real photos of people. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const i = h % AVATAR_TINTS.length;
  return (
    <span
      className={cn("grid size-11 shrink-0 place-items-center rounded-full font-display text-sm font-semibold", className)}
      style={{ background: AVATAR_TINTS[i], color: AVATAR_INKS[i] }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold tracking-[0.14em] text-accord uppercase", className)}>{children}</p>;
}
