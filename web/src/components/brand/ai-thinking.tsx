"use client";

import { Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "cn";

/**
 * Staged "AI is working" checklist. Steps tick in one by one; the last step
 * keeps spinning until `done` is true and at least `minMs` passed.
 * Call `onShown` once everything is ticked.
 */
export function AiThinking({
  steps,
  done,
  minMs = 1600,
  onShown,
  className,
  title = "AI tahlil qilmoqda",
}: {
  steps: string[];
  done: boolean;
  minMs?: number;
  onShown?: () => void;
  className?: string;
  title?: string;
}) {
  const [active, setActive] = useState(0);
  const [minPassed, setMinPassed] = useState(false);
  const per = Math.max(320, Math.floor(minMs / steps.length));

  useEffect(() => {
    const t = setTimeout(() => setMinPassed(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  useEffect(() => {
    if (active >= steps.length - 1) return;
    const t = setTimeout(() => setActive((a) => a + 1), per);
    return () => clearTimeout(t);
  }, [active, per, steps.length]);

  const finished = done && minPassed && active >= steps.length - 1;
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => onShown?.(), 280);
    return () => clearTimeout(t);
  }, [finished, onShown]);

  return (
    <div className={cn("sheet relative overflow-hidden p-5 sm:p-6", className)} role="status" aria-live="polite">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accord to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-accord-tint text-accord">
          <Sparkles className="size-[18px]" />
        </span>
        <p className="font-display text-[0.95rem] font-semibold text-ink">{title}</p>
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => {
          const isDone = i < active || finished;
          const isActive = i === active && !finished;
          return (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: i <= active ? 1 : 0.35, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center gap-3 text-[0.95rem]"
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                  isDone ? "border-accord bg-accord text-white" : "border-input bg-white",
                )}
              >
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.span key="ok" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
                      <Check className="size-3.5" strokeWidth={3} />
                    </motion.span>
                  ) : isActive ? (
                    <motion.span
                      key="spin"
                      className="block size-3 rounded-full border-2 border-accord border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  ) : null}
                </AnimatePresence>
              </span>
              <span className={cn(isDone ? "text-ink" : isActive ? "font-medium text-ink" : "text-ink-soft")}>{s}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
