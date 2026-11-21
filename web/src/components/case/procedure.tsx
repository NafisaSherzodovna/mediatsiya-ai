"use client";

import { CalendarClock, ChevronDown, FileText, Hourglass } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errorText } from "@/lib/api";
import { dateUz } from "@/lib/format";
import type { RoomTarget } from "@/lib/rooms";
import type { Procedure, Room, RoomParty } from "@/lib/types";

const base = (t: RoomTarget) => (t.kind === "case" ? `/rooms/${t.id}/` : `/rooms/t/${t.token}/`);

/** Art. 19, 20: the written procedure agreement. `draft` = what the respondent agrees to by confirming the mediator. */
export function ProcedureDoc({ p, open: initial = false }: { p: Procedure; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <section className="hujjat overflow-hidden font-doc">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 p-5 pl-14 text-left">
        <FileText className="mt-0.5 size-5 shrink-0 text-accord" />
        <span className="min-w-0 flex-1">
          <span className="block font-sans text-xs font-semibold tracking-[0.12em] text-accord uppercase">
            {p.draft ? "Kelishuv shartlari · tasdiqlasangiz kuchga kiradi" : "Yozma kelishuv · 19, 20-moddalar"}
          </span>
          <span className="mt-1 block text-[1.05rem] leading-snug font-semibold text-ink">{p.title}</span>
          {!p.draft && (
            <span className="mt-1 block font-sans text-sm text-ink-soft">
              {dateUz(p.started_at, false)} — {dateUz(p.deadline, false)}
            </span>
          )}
        </span>
        <ChevronDown className={cn("mt-1 size-5 shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 px-5 pb-5 pl-14">
          <ol className="space-y-2.5">
            {p.clauses.map((c) => (
              <li key={c.title}>
                <p className="font-semibold text-ink">{c.title}</p>
                <p className="text-[0.98rem] leading-relaxed text-ink">{c.body}</p>
              </li>
            ))}
          </ol>
          <p className="font-sans text-xs text-ink-soft">{p.note}</p>
        </div>
      )}
    </section>
  );
}

/** Art. 23: 30 days, extendable once by 30 days when both parties agree. Parties get the extension controls. */
export function TermCard({ room, party, target, onChange }: { room: Pick<Room, "procedure_deadline" | "extended" | "extension_requested_by">; party?: RoomParty; target?: RoomTarget; onChange?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now()); // fixed per mount: "days left" need not tick
  if (!room.procedure_deadline) return null;
  const left = Math.ceil((new Date(room.procedure_deadline).getTime() - now) / 86_400_000);
  const asked = room.extension_requested_by;

  async function extend() {
    if (!target) return;
    setBusy(true);
    try {
      await api(`${base(target)}extend/`, { body: {} });
      toast.success(asked ? "Muddat 30 kunga uzaytirildi" : "Soʻrov ikkinchi tomonga yuborildi");
      onChange?.();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cn("sheet p-5", left <= 5 && "border-warn/40")}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accord-tint text-accord">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">Mediatsiya muddati: {dateUz(room.procedure_deadline, false)} gacha</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            {left > 0 ? `${left} kun qoldi.` : "Muddat tugadi."} Qonun boʻyicha 30 kun{room.extended ? ", taraflar roziligi bilan 30 kunga uzaytirilgan" : ""}; muddat
            oʻtsa, mediatsiya tugatiladi (23, 24-moddalar).
          </p>
          {party && !room.extended && (
            <div className="mt-3">
              {asked === party ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-[#7a4f12]">
                  <Hourglass className="size-4" /> Uzaytirish soʻraldi, ikkinchi tomon roziligi kutilmoqda
                </p>
              ) : asked ? (
                <Button size="sm" variant="accord" disabled={busy} onClick={extend} className="h-auto py-2 whitespace-normal">
                  Ikkinchi tomon 30 kunga uzaytirishni soʻradi — roziman
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={busy} onClick={extend}>
                  Muddatni 30 kunga uzaytirishni soʻrash
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const MONEY_RULE =
  "Toʻlangan mediator haqi: ikkala ulush toʻlangan va kamida bitta uchrashuv oʻtkazilgan boʻlsa, mediatorga oʻtkaziladi, aks holda toʻliq qaytariladi (tartib-taomil kelishuvining 9-bandi).";

/** Art. 7, 11, 24: a party withdraws at any stage; the mediator ends it when no agreement is possible. */
export function TerminateButton({ target, who, onDone, className }: { target: RoomTarget; who: "party" | "mediator"; onDone: () => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const mediator = who === "mediator";

  async function go() {
    setBusy(true);
    try {
      await api(`${base(target)}terminate/`, { body: { reason } });
      toast.success("Mediatsiya tugatildi");
      setOpen(false);
      onDone();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("text-sm font-medium text-ink-soft underline decoration-rule hover:text-stop", className)}>
        {mediator ? "Kelishuvga erishib boʻlmadi — tugatish" : "Mediatsiyani tugatish"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{mediator ? "Mediatsiyani tugatasizmi?" : "Mediatsiyadan voz kechasizmi?"}</DialogTitle>
            <DialogDescription>
              {mediator
                ? "Nizo boʻyicha oʻzaro maqbul qarorga erishish imkoni yoʻq boʻlsa, mediatsiya tugatiladi (24-modda)."
                : "Qonunga koʻra har bir taraf mediatsiyaning istalgan bosqichida undan voz kechishga haqli (7, 11-moddalar). Sudga murojaat qilish huquqingiz saqlanadi."}
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-muted px-3.5 py-2.5 text-sm text-ink">{MONEY_RULE}</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="Sabab (ixtiyoriy)"
            className="w-full resize-none rounded-xl border border-input bg-white px-3.5 py-2.5 text-ink outline-none focus:border-accord"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" disabled={busy} onClick={go}>
              {busy ? "Tugatilmoqda…" : "Ha, tugatish"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
