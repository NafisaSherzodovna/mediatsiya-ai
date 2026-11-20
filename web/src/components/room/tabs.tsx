"use client";

import { motion } from "motion/react";
import { cn } from "cn";

/** Segmented tabs with a sliding indicator and optional badges. */
export function RoomTabs<T extends string>({
  tabs,
  value,
  onChange,
  id,
}: {
  tabs: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div className="no-print -mx-1 overflow-x-auto px-1">
      <div role="tablist" className="inline-flex gap-1 rounded-2xl bg-muted p-1">
        {tabs.map((t) => {
          const on = t.value === value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => onChange(t.value)}
              className={cn("relative rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors", on ? "text-ink" : "text-ink-soft hover:text-ink")}
            >
              {on && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative flex items-center gap-1.5">
                {t.label}
                {!!t.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accord px-1.5 text-[0.7rem] font-bold text-white">{t.badge}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
