"use client";

import { Check, CircleDot } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "cn";
import { AiSourceChip, Avatar, StatusBadge } from "@/components/brand/bits";
import { dateUz, som } from "@/lib/format";
import { DISPUTE_LABEL, REGION_LABEL } from "@/lib/labels";
import type { Case, CaseEvent, Position } from "@/lib/types";

export function CaseCard({ item, href, index = 0 }: { item: Case; href: string; index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.35 }}>
      <Link href={href} className="sheet group block p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-ink-soft">{item.code}</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">
              {DISPUTE_LABEL[item.dispute_type]}
              {item.amount_uzs ? <span className="text-ink-soft"> · {som(item.amount_uzs)}</span> : null}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-[0.95rem] text-ink-soft">{item.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span className="flex items-center gap-2">
            <Avatar name={item.respondent.name || "?"} className="size-7 text-[0.65rem]" />
            {item.respondent.name}
          </span>
          <span>{dateUz(item.updated_at, false)}</span>
        </div>
      </Link>
    </motion.div>
  );
}

export function Timeline({ events }: { events: CaseEvent[] }) {
  return (
    <ol className="relative ml-3 border-l-2 border-rule pl-6">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <motion.li
            key={`${e.kind}-${e.at}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="relative pb-5 last:pb-0"
          >
            <span
              className={cn(
                "absolute top-0.5 -left-[35px] grid size-6 place-items-center rounded-full ring-4 ring-paper",
                last ? "bg-accord text-white" : "bg-accord-tint text-accord",
              )}
            >
              {last ? <CircleDot className="size-3.5" /> : <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <p className={cn("font-medium", last ? "text-ink" : "text-ink-soft")}>{e.label}</p>
            <p className="text-xs text-ink-soft">{dateUz(e.at)}</p>
          </motion.li>
        );
      })}
    </ol>
  );
}

export function PositionCard({ title, name, data, tone }: { title: string; name: string; data: Position; tone: "ink" | "accord" }) {
  return (
    <div className={cn("sheet p-5", tone === "accord" && "bg-[linear-gradient(180deg,#fff,var(--accord-tint))]")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={name} className="size-9 text-xs" />
          <div className="leading-tight">
            <p className="font-semibold text-ink">{name}</p>
            <p className="text-xs text-ink-soft">{title}</p>
          </div>
        </div>
        <AiSourceChip source={data.source} />
      </div>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink">{data.summary}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Xohlaydi" items={data.wants} />
        <Row label="Taklif qiladi" items={data.can_offer} />
        {data.concerns.length > 0 && <Row label="Xavotir" items={data.concerns} />}
      </dl>
    </div>
  );
}

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{label}</dt>
      <dd className="mt-0.5 text-ink">{items.join("; ")}</dd>
    </div>
  );
}

export function CaseHeader({ item }: { item: Case }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-mono text-sm text-ink-soft">{item.code}</p>
        <h1 className="mt-1 text-[1.8rem] leading-tight font-semibold text-ink sm:text-[2.1rem]">
          {DISPUTE_LABEL[item.dispute_type]}
          {item.amount_uzs ? <span className="text-ink-soft"> · {som(item.amount_uzs)}</span> : null}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {REGION_LABEL[item.region]} · {dateUz(item.created_at, false)}
        </p>
      </div>
      <StatusBadge status={item.status} className="text-sm" />
    </div>
  );
}
