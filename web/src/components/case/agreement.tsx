"use client";

import { ExternalLink, Lightbulb, ShieldAlert, Target, Users } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "cn";
import { AiSourceChip } from "@/components/brand/bits";
import { Seal } from "@/components/brand/seal";
import { dateUz } from "@/lib/format";
import type { Agreement, Brief, Case } from "@/lib/types";

export function BriefCard({ brief }: { brief: Brief }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="sheet overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-muted/60 px-5 py-3">
        <p className="font-display font-semibold text-ink">AI maʼlumotnoma</p>
        <AiSourceChip source={brief.source} />
      </div>
      <div className="space-y-5 p-5">
        <List title="Faktlar" items={brief.facts} />
        <div className="grid gap-4 sm:grid-cols-2">
          <List title="Murojaatchi xohlaydi" items={brief.claimant_wants} />
          <List title="Ikkinchi tomon xohlaydi" items={brief.respondent_wants} />
        </div>
        <div className="rounded-xl border border-accord/25 bg-accord-tint p-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-accord-strong uppercase">
            <Users className="size-4" /> Umumiy nuqtalar
          </p>
          <ul className="mt-2 space-y-1 text-ink">
            {brief.common_ground.map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <Target className="size-4" /> Kelishuv oraligʻi (ZOPA)
          </p>
          <p className="mt-1.5 text-[1.05rem] leading-relaxed text-ink">
            <span className="marker">{brief.zopa}</span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <List title="Variantlar" items={brief.suggested_options} icon={<Lightbulb className="size-4" />} />
          <List title="Xavflar" items={brief.risks} icon={<ShieldAlert className="size-4" />} />
        </div>
      </div>
    </motion.div>
  );
}

function List({ title, items, icon }: { title: string; items: string[]; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">
        {icon}
        {title}
      </p>
      <ul className="mt-1.5 space-y-1 text-[0.95rem] text-ink">
        {items.map((x) => (
          <li key={x}>• {x}</li>
        ))}
      </ul>
    </div>
  );
}

/** The agreement as a printable A4 document. */
export function AgreementDoc({ c, agreement, qr, stamped = true, className }: { c: Case; agreement: Agreement; qr?: string; stamped?: boolean; className?: string }) {
  const date = c.agreed_at ?? new Date().toISOString();
  return (
    <article className={cn("hujjat relative mx-auto w-full max-w-[820px] p-7 pl-16 font-doc text-ink sm:p-12 sm:pl-24 print:border-0 print:shadow-none", className)}>
      <header className="text-center sm:px-24">
        <p className="font-sans text-xs font-semibold tracking-[0.18em] text-ink-soft uppercase">Toshkent sh. · {dateUz(date, false)} 2026-yil</p>
        <h1 className="mt-3 font-doc text-2xl font-semibold tracking-normal sm:text-[1.7rem]">{agreement.title}</h1>
        <p className="mt-1 font-sans text-sm text-ink-soft">«Mediatsiya toʻgʻrisida»gi Qonun asosida tuzilgan</p>
      </header>
      <ol className="mt-8 space-y-5">
        {agreement.clauses.map((cl) => (
          <li key={cl.title}>
            <p className="font-semibold">{cl.title}</p>
            <p className="mt-1 text-[1.02rem] leading-relaxed">{cl.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 grid gap-8 font-sans text-sm sm:grid-cols-3">
        {[
          { r: "Murojaatchi", n: c.claimant.name },
          { r: "Ikkinchi tomon", n: c.respondent.name },
          { r: "Mediator", n: c.mediator?.name ?? "—" },
        ].map((s) => (
          <div key={s.r}>
            <div className="h-10 border-b border-ink/40" />
            <p className="mt-1.5 font-semibold text-ink">{s.n}</p>
            <p className="text-ink-soft">{s.r}</p>
          </div>
        ))}
      </div>
      <footer className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-rule pt-5 font-sans text-xs text-ink-soft">
        <div className="space-y-1">
          <p>Ish raqami: {c.code}</p>
          {agreement.citations.map((ct) => (
            <a key={ct.url + ct.article} href={ct.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink">
              {ct.article}
              {ct.title ? ` — ${ct.title}` : ""} <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
        {qr && <QRCodeSVG value={qr} size={76} fgColor="#1b2a4a" />}
      </footer>
      <Seal stamped={stamped} sub={c.code} className="absolute top-6 right-6 size-28 sm:top-10 sm:right-10 sm:size-32" delay={0.25} />
    </article>
  );
}
