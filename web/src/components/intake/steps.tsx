"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  Phone,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { AiSourceChip } from "@/components/brand/bits";
import { Seal } from "@/components/brand/seal";
import { CompareBars } from "@/components/case/compare-bars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SAMPLE_DISPUTES } from "@/lib/demo";
import { som } from "@/lib/format";
import { DISPUTE_LABEL, DISPUTE_TYPES, REGION_LABEL, REGIONS } from "@/lib/labels";
import type { Case, Classification, Comparison, DisputeType, Region } from "@/lib/types";
import { VoiceButton } from "./voice-button";

export const STEP_TITLES = ["Tavsif", "Tahlil", "Taqqoslash", "Ikkinchi tomon", "Taklif"];

export function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Bosqichlar">
      {STEP_TITLES.map((t, i) => (
        <li key={t} className="flex flex-1 flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
            <motion.div
              className="h-full rounded-full bg-accord"
              initial={false}
              animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className={cn("hidden text-xs font-medium sm:block", i <= step ? "text-ink" : "text-ink-soft/70")}>{t}</span>
        </li>
      ))}
    </ol>
  );
}

export function StepHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">{eyebrow}</p>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-semibold text-ink sm:text-[2.1rem]">{title}</h1>
      {text && <p className="mt-2 text-ink-soft">{text}</p>}
    </div>
  );
}

// ---------------- 1. Describe ----------------

export function DescribeStep({
  text,
  setText,
  region,
  setRegion,
  onNext,
}: {
  text: string;
  setText: (t: string) => void;
  region: Region;
  setRegion: (r: Region) => void;
  onNext: () => void;
}) {
  const left = Math.max(0, 20 - text.trim().length);
  return (
    <div>
      <StepHeading eyebrow="1-qadam" title="Nima boʻldi?" text="Nizoni oʻz soʻzingiz bilan yozing yoki ovoz bilan aytib bering. Oʻzbekcha yoki ruscha boʻlishi mumkin." />
      <div className="sheet p-4 sm:p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Masalan: Ijarachim 3 oydan beri toʻlamayapti, qarzi 9 million soʻm boʻldi…"
          className="min-h-40 w-full resize-y rounded-xl bg-transparent text-[1.05rem] leading-relaxed text-ink outline-none placeholder:text-ink-soft/60"
          aria-label="Nizo tavsifi"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
          <VoiceButton onText={(t) => setText(text.trim() ? `${text.trim()} ${t}` : t)} />
          <span className={cn("text-sm", left ? "text-ink-soft" : "text-accord")}>
            {left ? `Yana kamida ${left} ta belgi` : "Yetarli, davom etishingiz mumkin"}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm text-ink-soft">Namuna bilan sinab koʻring:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_DISPUTES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setText(s.text)}
              className="rounded-full border border-rule bg-white px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accord/50 hover:bg-accord-tint"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 max-w-xs space-y-1.5">
        <Label htmlFor="region">Hudud</Label>
        <select
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value as Region)}
          className="h-11 w-full rounded-xl border border-input bg-white px-3 text-ink"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {REGION_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 flex justify-end">
        <Button size="lg" variant="accord" disabled={left > 0} onClick={onNext}>
          AI tahliliga yuborish <Sparkles className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------- 2. Classification ----------------

function ConfidenceRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-16">
      <svg viewBox="0 0 56 56" className="size-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--accord-tint)" strokeWidth="6" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--accord)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xs font-semibold text-ink">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function ClassifyStep({
  data,
  setType,
  onNext,
  onBack,
}: {
  data: Classification;
  setType: (t: DisputeType) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState(false);
  if (!data.mediable) {
    return (
      <div>
        <StepHeading eyebrow="2-qadam" title="Bu holatda mediatsiya qoʻllanmaydi" />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-stop/30 bg-stop-tint p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-6 shrink-0 text-stop" />
            <div>
              <p className="text-[1.05rem] leading-relaxed text-ink">{data.reason}</p>
              <ul className="mt-4 space-y-2 text-ink">
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-stop" /> Ichki ishlar organlari: <b>102</b>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-stop" /> Favqulodda yordam: <b>112</b>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        <div className="mt-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" /> Matnni oʻzgartirish
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <StepHeading eyebrow="2-qadam" title="AI nizoni shunday tushundi" text="Toʻgʻri boʻlsa, davom eting. Notoʻgʻri boʻlsa, turini oʻzgartiring." />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="sheet p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-soft">Nizo turi</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{DISPUTE_LABEL[data.dispute_type]}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accord-tint px-2.5 py-1 text-xs font-semibold text-accord-strong">
                <Check className="size-3.5" /> Mediatsiya mumkin
              </span>
              <AiSourceChip source={data.source} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ConfidenceRing value={data.confidence} />
            <span className="text-xs text-ink-soft">ishonch</span>
          </div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-rule pt-4 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm text-ink-soft">Qisqacha</p>
            <p className="mt-1 leading-relaxed text-ink">{data.summary}</p>
          </div>
          {data.amount_uzs ? (
            <div className="sm:text-right">
              <p className="text-sm text-ink-soft">Summa</p>
              <p className="mt-1 font-display text-xl font-semibold text-ink tabular">{som(data.amount_uzs)}</p>
            </div>
          ) : null}
        </div>
        <p className="mt-4 rounded-xl bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">{data.reason}</p>
        {editing && (
          <div className="mt-4 flex flex-wrap gap-2">
            {DISPUTE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setEditing(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium",
                  t === data.dispute_type ? "border-ink bg-ink text-white" : "border-rule bg-white text-ink hover:bg-ink-wash",
                )}
              >
                {DISPUTE_LABEL[t]}
              </button>
            ))}
          </div>
        )}
      </motion.div>
      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <Button variant="ghost" onClick={() => setEditing((e) => !e)}>
          Turini oʻzgartirish
        </Button>
        <Button size="lg" variant="accord" onClick={onNext}>
          Toʻgʻri, davom etish <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------- 3. Compare ----------------

export function CompareStep({ data, onNext, onBack }: { data: Comparison; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <StepHeading eyebrow="3-qadam" title="Sud yoki mediatsiya?" text="Sizning nizongiz uchun taxminiy hisob." />
      <CompareBars data={data} />
      <div className="mt-5 space-y-2">
        {data.notes.map((n) => (
          <p key={n} className="flex items-start gap-2 text-[0.95rem] text-ink">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-accord" /> {n}
          </p>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
        <AiSourceChip source={data.source} />
        <span>Raqamlar taxminiy.</span>
        {data.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-rule hover:text-ink">
            {s.title} <ExternalLink className="size-3.5" />
          </a>
        ))}
      </div>
      <div className="mt-8 flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Orqaga
        </Button>
        <Button size="lg" variant="accord" onClick={onNext}>
          Mediatsiyani tanlash <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------- 4. Respondent ----------------

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998 ${p.join(" ")}`.trim();
}

export function RespondentStep({
  name,
  setName,
  phone,
  setPhone,
  onNext,
  onBack,
}: {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = name.trim().length >= 3 && phone.replace(/\D/g, "").length === 12;
  return (
    <div>
      <StepHeading eyebrow="4-qadam" title="Ikkinchi tomon kim?" text="Unga xushmuomala taklif yuboramiz. Hisob ochishi shart emas — havola orqali javob beradi." />
      <div className="sheet space-y-4 p-5 sm:p-6">
        <div className="space-y-1.5">
          <Label htmlFor="rname">Ism va familiya</Label>
          <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bekzod Umarov" className="h-12 text-base" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rphone">Telefon</Label>
          <Input
            id="rphone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="+998 93 111 22 33"
            className="h-12 text-base tabular"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> Orqaga
        </Button>
        <Button size="lg" variant="accord" disabled={!valid} onClick={onNext}>
          Taklif matnini tayyorlash <Sparkles className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------- 5. Invite ----------------

export function InviteStep({
  text,
  setText,
  checks,
  source,
  busy,
  onSend,
  onBack,
}: {
  text: string;
  setText: (v: string) => void;
  checks: string[];
  source: "ai" | "fallback";
  busy: boolean;
  onSend: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <StepHeading eyebrow="5-qadam" title="Taklif tayyor" text="AI betaraf ohangda yozdi. Xohlasangiz, tahrirlang." />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hujjat p-5 pl-14 sm:p-6 sm:pl-16">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="w-full resize-y bg-transparent font-doc text-[1.08rem] leading-relaxed text-ink outline-none"
          aria-label="Taklif matni"
        />
      </motion.div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AiSourceChip source={source} />
        {checks.map((c, i) => (
          <motion.span
            key={c}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.12 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-accord-tint px-2.5 py-1 text-xs font-semibold text-accord-strong"
          >
            <Check className="size-3.5" /> {c}
          </motion.span>
        ))}
      </div>
      <div className="mt-8 flex justify-between gap-3">
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          <ArrowLeft className="size-4" /> Orqaga
        </Button>
        <Button size="lg" variant="accord" onClick={onSend} disabled={busy || text.trim().length < 20}>
          {busy ? "Yuborilmoqda…" : "Taklifni yuborish"} <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------- 6. Sent ----------------

export function SentStep({ item, link }: { item: Case; link: string }) {
  const tg = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(item.invite_text)}`;
  return (
    <div className="text-center">
      <div className="relative flex justify-center">
        <Seal label="YUBORILDI" sub={item.code} className="size-32" />
      </div>
      <h1 className="mt-4 text-[1.9rem] font-semibold text-ink">Taklif tayyor</h1>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        <b className="text-ink">{item.respondent.name}</b> havolani ochib, roziligini bildiradi. Javobni ish sahifasida koʻrasiz.
      </p>

      <div className="sheet mx-auto mt-7 max-w-lg p-5 text-left">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="rounded-xl border border-rule bg-white p-2.5">
            <QRCodeSVG value={link} size={120} fgColor="#1b2a4a" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">Taklif havolasi</p>
            <p className="mt-1 truncate font-mono text-sm text-ink">{link}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" className="bg-[#229ED9] text-white hover:bg-[#1b8bc0]">
                <a href={tg} target="_blank" rel="noreferrer">
                  <Send className="size-4" /> Telegram orqali
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(link).then(
                    () => toast.success("Havola nusxalandi"),
                    () => toast.error("Nusxalab boʻlmadi"),
                  );
                }}
              >
                <Copy className="size-4" /> Nusxa olish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" variant="accord">
          <Link href={`/ishlar/${item.id}`}>
            Ishni koʻrish <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={`/taklif/${item.invite_token}`} target="_blank">
            Ikkinchi tomon nima koʻradi? <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>
      <Button asChild variant="ghost" className="mt-3">
        <Link href="/ishlar">
          <ArrowLeft className="size-4" /> Kabinetga qaytish
        </Link>
      </Button>
    </div>
  );
}
