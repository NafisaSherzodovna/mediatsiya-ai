"use client";

import { Ban, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import type { Case } from "@/lib/types";

const WORDS = ["Umuman yoqmadi", "Juda yomon", "Yomon", "Oʻrtacha", "Yaxshi", "Aʼlo"];

/** After the case ends the claimant rates the mediator once: 0–5 stars. */
export function ReviewCard({ c, onDone }: { c: Case; onDone: (c: Case) => void }) {
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (c.review) {
    return (
      <section className="sheet p-5">
        <h2 className="text-lg font-semibold text-ink">Sizning bahoingiz</h2>
        <Stars value={c.review.stars} className="mt-2" />
        {c.review.comment && <p className="mt-2 text-ink-soft">«{c.review.comment}»</p>}
      </section>
    );
  }

  async function send() {
    if (stars === null) return;
    setBusy(true);
    try {
      onDone(await api<Case>(`/cases/${c.id}/review/`, { body: { stars, comment } }));
      toast.success("Rahmat! Bahoingiz mediator reytingiga qoʻshildi");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sheet p-5">
      <h2 className="text-lg font-semibold text-ink">Mediatorni baholang</h2>
      <p className="mt-1 text-sm text-ink-soft">{c.mediator?.name} bilan ishlash qanday boʻldi? Bahoingiz boshqa fuqarolarga tanlashda yordam beradi.</p>
      <div role="radiogroup" aria-label="Baho, 0 dan 5 gacha" className="mt-4 flex items-center gap-1">
        <button
          type="button"
          role="radio"
          aria-checked={stars === 0}
          aria-label="0 yulduz"
          onClick={() => setStars(0)}
          className={cn("mr-1 grid size-10 place-items-center rounded-full border transition-colors", stars === 0 ? "border-stop bg-stop-tint text-stop" : "border-rule text-ink-soft hover:bg-ink-wash")}
        >
          <Ban className="size-4" />
        </button>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} yulduz`}
            onClick={() => setStars(n)}
            className="grid size-10 place-items-center rounded-full transition-transform hover:scale-110"
          >
            <Star className={cn("size-7", stars !== null && n <= stars ? "fill-warn text-warn" : "text-rule")} />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-ink-soft">{stars === null ? "Tanlang" : `${stars}/5 · ${WORDS[stars]}`}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder="Izoh (ixtiyoriy)"
        rows={2}
        className="mt-3 w-full resize-none rounded-xl border border-rule bg-white px-3.5 py-2.5 text-ink outline-none focus:border-accord focus:ring-2 focus:ring-accord/20"
      />
      <Button variant="accord" className="mt-3" disabled={stars === null || busy} onClick={send}>
        {busy ? "Yuborilmoqda…" : "Bahoni yuborish"}
      </Button>
    </section>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)} aria-label={`${value} yulduz, 5 dan`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-5", n <= value ? "fill-warn text-warn" : "text-rule")} />
      ))}
    </span>
  );
}
