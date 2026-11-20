"use client";

import NumberFlow from "@number-flow/react";
import { Gavel, Handshake } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "cn";
import { days } from "@/lib/format";
import type { Comparison, Track } from "@/lib/types";

/** Court vs mediation: days and cost bars that grow when scrolled into view. */
export function CompareBars({ data, compact, className }: { data: Comparison; compact?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const maxDays = Math.max(data.court.days_max, data.mediation.days_max);
  const maxCost = Math.max(data.court.cost_uzs, data.mediation.cost_uzs);
  const savedDays = data.court.days_max - data.mediation.days_max;
  const savedCost = data.court.cost_uzs - data.mediation.cost_uzs;

  return (
    <div ref={ref} className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <Column kind="court" track={data.court} maxDays={maxDays} maxCost={maxCost} show={inView} compact={compact} />
      <Column kind="mediation" track={data.mediation} maxDays={maxDays} maxCost={maxCost} show={inView} compact={compact} />
      {!compact && (savedDays > 0 || savedCost > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-accord px-5 py-4 text-white sm:col-span-2"
        >
          <p className="font-display text-sm font-semibold tracking-wide uppercase opacity-80">Mediatsiya bilan tejaysiz</p>
          {savedDays > 0 && (
            <p className="font-display text-xl font-semibold tabular">
              ~<NumberFlow value={inView ? savedDays : 0} /> kun
            </p>
          )}
          {savedCost > 0 && (
            <p className="font-display text-xl font-semibold tabular">
              ~<NumberFlow value={inView ? savedCost : 0} locales="ru-RU" /> soʻm
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Column({
  kind,
  track,
  maxDays,
  maxCost,
  show,
  compact,
}: {
  kind: "court" | "mediation";
  track: Track;
  maxDays: number;
  maxCost: number;
  show: boolean;
  compact?: boolean;
}) {
  const court = kind === "court";
  const color = court ? "var(--court)" : "var(--accord)";
  const Icon = court ? Gavel : Handshake;
  const delay = court ? 0.15 : 0.45;
  return (
    <div
      className={cn(
        "sheet relative overflow-hidden p-5",
        court ? "bg-[linear-gradient(180deg,#fff,var(--court-tint))]" : "bg-[linear-gradient(180deg,#fff,var(--accord-tint))]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg text-white" style={{ background: color }}>
          <Icon className="size-[18px]" />
        </span>
        <p className="font-display text-lg font-semibold text-ink">{court ? "Sud" : "Mediatsiya"}</p>
      </div>

      <Metric
        label="Vaqt"
        value={days(track.days_min, track.days_max)}
        ratio={track.days_max / maxDays}
        color={color}
        show={show}
        delay={delay}
      />
      <Metric
        label="Xarajat"
        value={
          <span className="tabular">
            <NumberFlow value={show ? track.cost_uzs : 0} locales="ru-RU" /> soʻm
          </span>
        }
        ratio={track.cost_uzs / maxCost}
        color={color}
        show={show}
        delay={delay + 0.2}
      />

      {!compact && track.items.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-rule pt-3 text-sm text-ink-soft">
          {track.items.map((it) => (
            <li key={it.label} className="flex justify-between gap-3">
              <span>{it.label}</span>
              <span className="tabular font-medium text-ink">{new Intl.NumberFormat("ru-RU").format(it.uzs)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  ratio,
  color,
  show,
  delay,
}: {
  label: string;
  value: React.ReactNode;
  ratio: number;
  color: string;
  show: boolean;
  delay: number;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-ink-soft">{label}</span>
        <span className="font-display text-[1.05rem] font-semibold text-ink">{value}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/[0.05]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, transformOrigin: "left" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: show ? Math.max(0.04, ratio) : 0 }}
          transition={{ type: "spring", stiffness: 70, damping: 18, delay }}
        />
      </div>
    </div>
  );
}
