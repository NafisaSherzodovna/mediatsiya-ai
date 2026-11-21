import { cn } from "cn";
import { BRAND } from "@/lib/brand";

/** The mark: two circles are the two sides; where they overlap (teal) is the common ground, the "murosa". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--ink)" />
      <path d="M20 12.8a8.6 8.6 0 0 1 0 14.4a8.6 8.6 0 0 1 0-14.4Z" fill="#5fd3c6" />
      <circle cx="15.3" cy="20" r="8.6" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="24.7" cy="20" r="8.6" fill="none" stroke="#fff" strokeWidth="2.2" />
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
