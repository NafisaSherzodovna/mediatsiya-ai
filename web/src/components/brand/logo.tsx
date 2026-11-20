import { cn } from "cn";
import { BRAND } from "@/lib/brand";

/** The mark: a balanced scale of justice whose beam is the bridge between two sides; the fulcrum dot is the AI. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--ink)" />
      <path d="M20 10.5V29" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.5 30h11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.5 13.5c3.6-2.3 7.4-3.3 11.5-3.3s7.9 1 11.5 3.3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.5 13.5l-3.2 8.2M8.5 13.5l3.2 8.2M31.5 13.5l-3.2 8.2M31.5 13.5l3.2 8.2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <path d="M4.6 21.7h7.8a3.9 3.9 0 0 1-7.8 0ZM27.6 21.7h7.8a3.9 3.9 0 0 1-7.8 0Z" fill="#5fd3c6" />
      <circle cx="20" cy="10.2" r="2.4" fill="#5fd3c6" />
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
