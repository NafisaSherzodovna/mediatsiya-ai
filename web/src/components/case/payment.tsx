"use client";

import { CheckCircle2, Clock, CreditCard, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorText } from "@/lib/api";
import { som } from "@/lib/format";
import type { RoomTarget } from "@/lib/rooms";
import type { Payment, RoomParty } from "@/lib/types";

const STEP_LABEL: Record<Payment["status"], string> = {
  pending: "Toʻlov kutilmoqda",
  held: "Platformada muzlatilgan",
  released: "Mediatorga oʻtkazildi",
};

/** The mediator's read-only view: both halves, the platform's 10 % and what reaches the mediator. */
export function MediatorPaymentCard({ payment }: { payment: Payment }) {
  const label: Record<Payment["status"], string> = {
    pending: "Taraflar toʻlovi kutilmoqda",
    held: "Platformada muzlatilgan",
    released: "Hisobingizga oʻtkazildi",
  };
  return (
    <section className="sheet p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Wallet className="size-5 text-accord" /> Toʻlov
        </h2>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === "pending" ? "bg-warn-tint text-[#7a4f12]" : "bg-accord-tint text-accord"}`}>
          {label[payment.status]}
        </span>
      </div>
      <ul className="mt-4 grid gap-2 text-sm">
        <Share label="Murojaatchi ulushi" uzs={payment.claimant_share_uzs} done={!!payment.claimant_paid_at} />
        <Share label="Ikkinchi tomon ulushi" uzs={payment.respondent_share_uzs} done={!!payment.respondent_paid_at} />
        <li className="flex items-center justify-between gap-3 px-3.5 text-ink-soft">
          <span>Xizmat haqi (10 %)</span>
          <span className="font-semibold whitespace-nowrap tabular">− {som(payment.commission_uzs)}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-xl border border-accord/30 bg-accord-tint px-3.5 py-2.5">
          <span className="font-semibold text-ink">Sizga oʻtkaziladi</span>
          <span className="font-display text-lg font-semibold whitespace-nowrap text-ink tabular">{som(payment.mediator_payout_uzs)}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        Taraflar toʻlagan pul platforma hisobida turadi va mediativ kelishuv imzolangach sizning hisobingizga oʻtkaziladi.
      </p>
    </section>
  );
}

/**
 * Demo escrow: each party pays its half of the mediator fee (Art. 28: equal shares) into the platform account; after the
 * agreement the platform keeps 10 % and pays the rest to the mediator. No card data leaves the browser.
 */
export function PaymentCard({ payment, party, target, onPaid }: { payment: Payment; party: RoomParty; target: RoomTarget; onPaid: () => void }) {
  const [open, setOpen] = useState(false);
  const mine = party === "claimant" ? payment.claimant_share_uzs : payment.respondent_share_uzs;
  const paid = !!(party === "claimant" ? payment.claimant_paid_at : payment.respondent_paid_at);
  const otherPaid = !!(party === "claimant" ? payment.respondent_paid_at : payment.claimant_paid_at);

  return (
    <section className="sheet p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Wallet className="size-5 text-accord" /> Mediator haqi
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            payment.status === "pending" ? "bg-warn-tint text-[#7a4f12]" : "bg-accord-tint text-accord"
          }`}
        >
          {STEP_LABEL[payment.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Jami {som(payment.fee_uzs)}, qonunga koʻra tomonlar teng boʻlib toʻlaydi. Pul platforma hisobiga tushadi va kelishuv imzolangach, 10 % xizmat
        haqi ushlab qolinib, qolgani mediatorga oʻtkaziladi.
      </p>

      <ul className="mt-4 grid gap-2 text-sm">
        <Share label="Sizning ulushingiz" uzs={mine} done={paid} />
        <Share label={party === "claimant" ? "Ikkinchi tomon ulushi" : "Murojaatchi ulushi"} uzs={payment.fee_uzs - mine} done={otherPaid} />
      </ul>

      {!paid && (
        <Button variant="accord" className="mt-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          <CreditCard className="size-4" /> {som(mine)} toʻlash
        </Button>
      )}
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink-soft">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-accord" />
        Kelishuvgacha mediatordan voz kechsangiz, toʻlangan pul toʻliq qaytariladi.
      </p>
      <PayDialog open={open} onOpenChange={setOpen} amount={mine} target={target} onPaid={onPaid} />
    </section>
  );
}

function Share({ label, uzs, done }: { label: string; uzs: number; done: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3.5 py-2.5">
      <span className="text-ink">{label}</span>
      <span className="flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap text-ink tabular">
        {som(uzs)}
        {done ? <CheckCircle2 className="size-4 text-accord" aria-label="toʻlangan" /> : <Clock className="size-4 text-ink-soft" aria-label="kutilmoqda" />}
      </span>
    </li>
  );
}

function PayDialog({ open, onOpenChange, amount, target, onPaid }: { open: boolean; onOpenChange: (v: boolean) => void; amount: number; target: RoomTarget; onPaid: () => void }) {
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [busy, setBusy] = useState(false);
  const digits = card.replace(/\D/g, "");
  const valid = digits.length === 16 && /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp);

  async function pay() {
    setBusy(true);
    try {
      // only the fact of payment goes to the server; the card number never leaves this form
      await api(target.kind === "case" ? `/cases/${target.id}/pay/` : `/rooms/t/${target.token}/pay/`, { body: {} });
      toast.success("Toʻlov qabul qilindi");
      onOpenChange(false);
      onPaid();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Karta orqali toʻlash</DialogTitle>
          <DialogDescription>Demo toʻlov: kartadan pul yechilmaydi.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) void pay();
          }}
        >
          <p className="font-display text-3xl font-semibold text-ink tabular">{som(amount)}</p>
          <div className="space-y-1.5">
            <Label htmlFor="card">Karta raqami</Label>
            <Input
              id="card"
              inputMode="numeric"
              autoComplete="off"
              placeholder="8600 0000 0000 0000"
              value={card}
              onChange={(e) => setCard((e.target.value.replace(/\D/g, "").slice(0, 16).match(/.{1,4}/g) ?? []).join(" "))}
              className="h-12 text-base tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp">Amal qilish muddati</Label>
            <Input
              id="exp"
              inputMode="numeric"
              autoComplete="off"
              placeholder="OO/YY"
              value={exp}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
              className="h-12 w-32 text-base tabular"
            />
          </div>
          <button
            type="button"
            className="text-sm font-medium text-accord underline decoration-accord/30 hover:decoration-accord"
            onClick={() => {
              setCard("8600 1234 5678 9012");
              setExp("12/29");
            }}
          >
            Demo karta bilan toʻldirish
          </button>
          <Button type="submit" size="lg" variant="accord" className="w-full" disabled={!valid || busy}>
            <LockKeyhole className="size-4" /> {busy ? "Toʻlanmoqda…" : "Toʻlash"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
