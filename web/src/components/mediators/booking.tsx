"use client";

import { BadgeCheck, Languages, MapPin, Send, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Avatar } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errorText } from "@/lib/api";
import { dmy, som } from "@/lib/format";
import { AREA_LABEL, areaOf, LANG_LABEL, REGION_LABEL } from "@/lib/labels";
import type { Case, Lang, Mediator } from "@/lib/types";
import { MediatorDirectory } from "./directory";

const TIMES = ["10:00", "14:00", "17:00"];

function nextDays(n: number): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const names = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  const d = new Date();
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) continue;
    const iso = d.toISOString().slice(0, 10);
    out.push({ iso, label: `${names[d.getDay()]}, ${d.getDate()}` });
  }
  return out;
}

/** A registry card. Without `onSelect` it is read-only (e.g. the respondent reviewing a proposal). */
export function MediatorCard({ m, selected, onSelect }: { m: Mediator; selected?: boolean; onSelect?: () => void }) {
  const Tag = onSelect ? "button" : "div";
  return (
    <Tag
      {...(onSelect && { type: "button" as const, onClick: onSelect })}
      className={cn(
        "w-full rounded-2xl border bg-white p-4 text-left transition-all",
        selected ? "border-accord ring-2 ring-accord/30" : "border-rule",
        onSelect && !selected && "hover:border-accord/40 hover:shadow-[var(--shadow-sheet)]",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={m.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-ink">{m.name}</p>
            {m.reviews > 0 ? (
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink" title={`${m.reviews} ta baho asosida`}>
                <Star className="size-4 fill-warn text-warn" /> {m.rating.toFixed(1)}
                <span className="font-normal text-ink-soft">({m.reviews})</span>
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-ink-wash px-2 py-0.5 text-xs font-medium text-ink-soft">Yangi</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-soft">
            Reyestr {m.registry_no}
            {m.registry_date && <> ({dmy(m.registry_date)})</>} · <b className="font-semibold text-ink">{m.resolved} ta ish hal qilgan</b> · {m.years} yil
            tajriba
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.areas.map((a) => (
              <span key={a} className="rounded-full bg-ink-wash px-2 py-0.5 text-xs font-medium text-ink">
                {AREA_LABEL[a]}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {REGION_LABEL[m.region]}
            </span>
            <span className="flex items-center gap-1">
              <Languages className="size-3.5" /> {m.languages.map((l) => LANG_LABEL[l] ?? l).join(", ")}
            </span>
            <span className="font-semibold text-ink">{som(m.price_uzs)} / sessiya</span>
          </div>
          {m.certificate_no && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
              <BadgeCheck className="size-3.5 text-accord" /> Oʻquv kursi hujjati: {m.certificate_no}
              {m.certificate_date && <>, {dmy(m.certificate_date)}</>}
            </p>
          )}
        </div>
      </div>
    </Tag>
  );
}

export function BookingDialog({
  open,
  onOpenChange,
  item,
  onBooked,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Case;
  onBooked: (c: Case) => void;
  initial?: Mediator | null;
}) {
  const [list, setList] = useState<Mediator[] | null>(null);
  const [pick, setPick] = useState<Mediator | null>(null);
  const [lang, setLang] = useState<Lang>("uz");
  const panel = useRef<HTMLDivElement>(null);
  const choose = (m: Mediator) => {
    setPick(m);
    setLang(m.languages.includes("uz") ? "uz" : m.languages[0]);
    // the time picker sits under a long list: bring it into view
    setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const [seeded, setSeeded] = useState<Mediator | null>(null);
  if (open && initial && seeded !== initial) {
    setSeeded(initial); // a mediator chosen in the catalog arrives preselected
    setPick(initial);
    setLang(initial.languages.includes("uz") ? "uz" : initial.languages[0]);
  }
  const days = useMemo(() => nextDays(5), []);
  const [day, setDay] = useState(days[0].iso);
  const [time, setTime] = useState(TIMES[0]);
  const [busy, setBusy] = useState(false);
  // rule-based "best fit": same region first, then rating, then cases resolved
  const ranked = list
    ? [...list].sort((a, b) => Number(b.region === item.region) - Number(a.region === item.region) || b.rating - a.rating || b.resolved - a.resolved)
    : null;
  const top = ranked?.slice(0, 3) ?? [];

  useEffect(() => {
    if (!open || !initial) return;
    // chosen in the catalog already: go straight to language and time
    const t = setTimeout(() => panel.current?.scrollIntoView({ block: "start" }), 150);
    return () => clearTimeout(t);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    api<Mediator[]>(`/mediators/?area=${areaOf(item.dispute_type)}`)
      .then((r) => alive && setList(r))
      .catch((e) => toast.error(errorText(e)));
    return () => {
      alive = false;
    };
  }, [open, item.dispute_type]);

  async function book() {
    if (!pick) return;
    setBusy(true);
    try {
      const c = await api<Case>(`/cases/${item.id}/book/`, { body: { mediator_id: pick.id, session_at: `${day}T${time}:00+05:00`, language: lang } });
      onBooked(c);
      onOpenChange(false);
      toast.success("Mediator taklif qilindi. Ikkinchi tomon tasdiqlashi kerak");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Mediator taklif qilish</DialogTitle>
          <DialogDescription>
            Adliya vazirligi reyestridagi mediatorlar. Qonunga koʻra mediatorni taraflar birgalikda tanlaydi: siz taklif qilasiz, ikkinchi tomon tasdiqlaydi.
          </DialogDescription>
        </DialogHeader>
        {top.length > 0 && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles className="size-4 text-accord" /> Sizga mos
            <span className="font-normal text-ink-soft">· soha, hudud va reyting boʻyicha</span>
          </p>
        )}
        <div className="grid gap-2.5">
          {ranked === null
            ? [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)
            : top.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <MediatorCard m={m} selected={pick?.id === m.id} onSelect={() => choose(m)} />
                </motion.div>
              ))}
        </div>
        <div className="border-t border-rule pt-4">
          <p className="mb-3 text-sm font-semibold text-ink">Barcha mediatorlar · oʻzingiz tanlang</p>
          <MediatorDirectory pickedId={pick?.id} onPick={choose} pageSize={6} />
        </div>
        {pick && (
          <motion.div ref={panel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="scroll-mt-4 space-y-3 border-t border-rule pt-4">
            <p className="font-semibold text-ink">
              Tanlangan mediator: <span className="text-accord">{pick.name}</span>
            </p>
            <label className="flex flex-wrap items-center gap-2 font-semibold text-ink">
              Mediatsiya tili
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="h-10 rounded-lg border border-input bg-white px-2.5 text-base font-normal text-ink"
              >
                {pick.languages.map((l) => (
                  <option key={l} value={l}>
                    {LANG_LABEL[l]}
                  </option>
                ))}
              </select>
            </label>
            <p className="font-semibold text-ink">Sessiya vaqti</p>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <Chip key={d.iso} on={day === d.iso} onClick={() => setDay(d.iso)}>
                  {d.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <Chip key={t} on={time === t} onClick={() => setTime(t)}>
                  {t}
                </Chip>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-ink-soft">
              Taklif qilish bilan mediatsiya tartib-taomili kelishuvi shartlariga rozilik bildirasiz: tanlangan til, 30 kunlik muddat, mediator haqini teng ulushda
              toʻlash, maxfiylik va istalgan bosqichda voz kechish huquqi (19, 20, 23, 28-moddalar). Ikkinchi tomon tasdiqlagach, kelishuv kuchga kiradi.
            </p>
            <Button size="lg" variant="accord" className="w-full" disabled={busy} onClick={book}>
              <Send className="size-5" /> {busy ? "Yuborilmoqda…" : "Ikkinchi tomonga taklif qilish"}
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full border px-3.5 py-2 text-sm font-medium transition-colors", on ? "border-ink bg-ink text-white" : "border-rule bg-white text-ink hover:bg-ink-wash")}
    >
      {children}
    </button>
  );
}
