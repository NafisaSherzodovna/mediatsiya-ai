"use client";

import { CalendarCheck, Languages, MapPin, Star } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Avatar } from "@/components/brand/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errorText } from "@/lib/api";
import { som } from "@/lib/format";
import { DISPUTE_LABEL, LANG_LABEL, REGION_LABEL } from "@/lib/labels";
import type { Case, DisputeType, Mediator } from "@/lib/types";

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

export function MediatorCard({ m, selected, onSelect }: { m: Mediator; selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border bg-white p-4 text-left transition-all",
        selected ? "border-accord ring-2 ring-accord/30" : "border-rule hover:border-accord/40 hover:shadow-[var(--shadow-sheet)]",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={m.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-ink">{m.name}</p>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
              <Star className="size-4 fill-warn text-warn" /> {m.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-soft">
            Reyestr {m.registry_no} · {m.sessions} sessiya · {m.years} yil tajriba
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.specialties.map((s) => (
              <span key={s} className="rounded-full bg-ink-wash px-2 py-0.5 text-xs font-medium text-ink">
                {DISPUTE_LABEL[s]}
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
        </div>
      </div>
    </button>
  );
}

export function BookingDialog({
  open,
  onOpenChange,
  item,
  onBooked,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Case;
  onBooked: (c: Case) => void;
}) {
  const [list, setList] = useState<Mediator[] | null>(null);
  const [onlyType, setOnlyType] = useState(true);
  const [pick, setPick] = useState<string | null>(null);
  const days = useMemo(() => nextDays(5), []);
  const [day, setDay] = useState(days[0].iso);
  const [time, setTime] = useState(TIMES[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const q = onlyType ? `?dispute_type=${item.dispute_type}` : "";
    api<Mediator[]>(`/mediators/${q}`)
      .then((r) => alive && setList(r))
      .catch((e) => toast.error(errorText(e)));
    return () => {
      alive = false;
    };
  }, [open, onlyType, item.dispute_type]);

  async function book() {
    if (!pick) return;
    setBusy(true);
    try {
      const c = await api<Case>(`/cases/${item.id}/book/`, { body: { mediator_id: pick, session_at: `${day}T${time}:00+05:00` } });
      onBooked(c);
      onOpenChange(false);
      toast.success("Sessiya belgilandi");
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
          <DialogTitle className="font-display text-xl">Mediator tanlash</DialogTitle>
          <DialogDescription>Adliya vazirligi reyestridagi mediatorlar. Reyting va tajriba boʻyicha saralangan.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={onlyType} onChange={(e) => setOnlyType(e.target.checked)} className="size-4 accent-[var(--accord)]" />
          Faqat «{DISPUTE_LABEL[item.dispute_type as DisputeType]}» nizolari mutaxassislari
        </label>
        <div className="grid gap-2.5">
          {list === null
            ? [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)
            : list.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <MediatorCard m={m} selected={pick === m.id} onSelect={() => setPick(m.id)} />
                </motion.div>
              ))}
          {list?.length === 0 && <p className="text-sm text-ink-soft">Mos mediator topilmadi. Filtrni olib tashlang.</p>}
        </div>
        {pick && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 border-t border-rule pt-4">
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
            <Button size="lg" variant="accord" className="w-full" disabled={busy} onClick={book}>
              <CalendarCheck className="size-5" /> {busy ? "Belgilanmoqda…" : "Sessiyani belgilash"}
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
