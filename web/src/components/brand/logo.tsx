import { cn } from "cn";
import { BRAND } from "@/lib/brand";

/** The mark: two arcs (the two sides) meeting under a seal ring — a bridge. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="var(--accord-tint)" stroke="var(--accord)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13.5" fill="none" stroke="var(--accord)" strokeWidth="0.9" strokeDasharray="1.6 2.2" />
      <path d="M8.5 25.5c3.2-6.4 7.4-9.6 11.5-9.6" fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31.5 25.5c-3.2-6.4-7.4-9.6-11.5-9.6" fill="none" stroke="var(--accord)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9 27.5h22" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <circle cx="20" cy="15.9" r="2.1" fill="var(--seal)" />
    </svg>
  );
}

export function Logo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-[1.05rem] font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        {BRAND.name}
      </span>
    </span>
  );
}
