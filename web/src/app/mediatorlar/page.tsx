"use client";

import { Info, Scale } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { BookingDialog } from "@/components/mediators/booking";
import { MediatorDirectory } from "@/components/mediators/directory";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DISPUTE_LABEL } from "@/lib/labels";
import type { Case, Mediator } from "@/lib/types";

export default function MediatorlarPage() {
  return (
    <AppShell roles={["claimant"]}>
      <Catalog />
    </AppShell>
  );
}

/** The claimant browses every registry mediator and proposes one for a case the other party has accepted. */
function Catalog() {
  const { data: cases, mutate } = useSWR<Case[]>("/cases/", (p: string) => api<Case[]>(p));
  const [picked, setPicked] = useState<Mediator | null>(null);
  const [caseId, setCaseId] = useState("");
  const [open, setOpen] = useState(false);
  // a mediator can be proposed once the other party agreed to mediation and no mediator is set yet
  const ready = cases?.filter((c) => c.status === "accepted") ?? [];
  const target = ready.find((c) => c.id === caseId) ?? ready[0];

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accord uppercase">
        <Scale className="size-4" /> Reyestr
      </p>
      <h1 className="mt-1 text-[2rem] font-semibold text-ink">Mediatorlar</h1>
      <p className="mt-1 text-ink-soft">
        Adliya vazirligi reyestridagi barcha mediatorlar. Mediatorni oʻzingiz tanlaysiz, ikkinchi tomon tasdiqlaydi (Qonun, 8, 11, 22-moddalar).
      </p>

      {picked && (
        <div className="sheet sticky top-20 z-20 mt-5 flex flex-wrap items-center gap-3 p-4">
          <p className="min-w-0 flex-1 text-ink">
            Tanlandi: <b>{picked.name}</b>
          </p>
          {ready.length === 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-ink-soft">
              <Info className="size-4 shrink-0" /> Taklif qilish uchun ikkinchi tomon rozi boʻlgan ish kerak.{" "}
              <Link href="/murojaat" className="font-semibold text-accord hover:underline">
                Murojaat qilish
              </Link>
            </p>
          ) : (
            <>
              {ready.length > 1 && (
                <select
                  value={target?.id}
                  onChange={(e) => setCaseId(e.target.value)}
                  aria-label="Qaysi ish uchun"
                  className="h-10 rounded-lg border border-input bg-white px-2.5 text-sm text-ink"
                >
                  {ready.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {DISPUTE_LABEL[c.dispute_type]}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="accord" onClick={() => setOpen(true)}>
                {ready.length === 1 ? `${target.code} uchun taklif qilish` : "Taklif qilish"}
              </Button>
            </>
          )}
        </div>
      )}

      <div className="mt-6">
        <MediatorDirectory pickedId={picked?.id} onPick={setPicked} pageSize={10} />
      </div>

      {target && (
        <BookingDialog
          open={open}
          onOpenChange={setOpen}
          item={target}
          initial={picked}
          onBooked={() => {
            setPicked(null);
            void mutate();
          }}
        />
      )}
    </div>
  );
}
