"use client";

import { Check, CircleSlash, FileDown, Hourglass, Scale, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentCard } from "@/components/case/payment";
import { ProcedureDoc, TermCard, TerminateButton } from "@/components/case/procedure";
import { MediatorCard } from "@/components/mediators/booking";
import { Button } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import { dateUz } from "@/lib/format";
import type { Room } from "@/lib/types";
import { useRoom } from "@/lib/rooms";
import { PartyApproval } from "./approval";
import { ChatPanel } from "./chat";
import { MeetingsPanel } from "./meetings";
import { RoomTabs } from "./tabs";

/** The respondent's room, reached through the same invite link — no account needed. */
export function RespondentRoom({ token }: { token: string }) {
  const target = { kind: "token" as const, token };
  const { data: room, mutate } = useRoom(target);
  const [tab, setTab] = useState<"chat" | "uchrashuv" | "kelishuv">("chat");
  const [busy, setBusy] = useState(false);

  async function act(path: string, body: object, done: string) {
    setBusy(true);
    try {
      await mutate(await api<Room>(`/rooms/t/${token}/${path}`, { body }), { revalidate: false });
      toast.success(done);
    } catch (e) {
      toast.error(errorText(e));
      void mutate();
    } finally {
      setBusy(false);
    }
  }

  if (!room) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />;

  if (room.status === "terminated") {
    return (
      <div className="mt-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-ink-soft">
          <CircleSlash className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Mediatsiya tugatildi</h1>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">
          Mediatsiya kelishuvsiz tugatildi{room.termination_reason ? `: «${room.termination_reason}»` : ""}. Sudga murojaat qilish huquqingiz saqlanadi.
        </p>
      </div>
    );
  }

  if (!room.mediator && room.proposed_mediator) {
    const m = room.proposed_mediator;
    return (
      <div className="mt-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Mediatsiya · {room.code}</p>
        <h1 className="mt-1.5 text-[1.6rem] leading-tight font-semibold text-ink">Mediatorni tasdiqlaysizmi?</h1>
        <p className="mt-1.5 leading-relaxed text-ink-soft">
          {room.names.claimant} shu mediatorni taklif qildi
          {room.proposed_session_at ? `, birinchi sessiya: ${dateUz(room.proposed_session_at)}` : ""}. Qonunga koʻra mediatorni taraflar birgalikda tanlaydi:
          rozi boʻlmasangiz, boshqasi taklif qilinadi.
        </p>
        <div className="mt-4">
          <MediatorCard m={m} />
        </div>
        {room.procedure && (
          <div className="mt-4">
            <ProcedureDoc p={room.procedure} open />
          </div>
        )}
        <p className="mt-4 text-sm text-ink-soft">
          «Roziman» tugmasi bilan mediatorni va yuqoridagi tartib-taomil kelishuvini tasdiqlaysiz: mediatsiya shu kundan boshlanadi (19-modda).
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button variant="accord" size="lg" disabled={busy} onClick={() => void act("mediator/", { mediator_id: m.id, accept: true }, "Mediator tasdiqlandi")}>
            <Check className="size-5" /> Roziman
          </Button>
          <Button variant="outline" size="lg" disabled={busy} onClick={() => void act("mediator/", { mediator_id: m.id, accept: false }, "Boshqa mediator soʻraldi")}>
            <X className="size-5" /> Boshqa mediator
          </Button>
        </div>
      </div>
    );
  }

  if (!room.mediator) {
    return (
      <div className="mt-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-warn-tint text-[#7a4f12]">
          <Hourglass className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Mediator tanlanmoqda</h1>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">
          Siz rozi boʻldingiz. {room.names.claimant} mediatorni taklif qilgach, uni shu yerda tasdiqlaysiz. Keyin mediator bilan suhbat va uchrashuvlar ochiladi.
        </p>
        <TerminateButton target={target} who="party" onDone={() => void mutate()} className="mt-4" />
      </div>
    );
  }

  const agreed = room.status === "agreed" || room.status === "closed";
  const needsApproval = !!room.agreement && !agreed && !room.approvals.respondent?.current;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Mediatsiya xonasi · {room.code}</p>
      <h1 className="mt-1.5 text-[1.6rem] leading-tight font-semibold text-ink">Mediator bilan aloqa</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
        <Scale className="size-4 text-accord" /> {room.mediator.name} · reyestr {room.mediator.registry_no}
      </p>
      {room.status === "scheduled" && (
        <div className="mt-4 space-y-3">
          <TermCard room={room} party="respondent" target={target} onChange={() => void mutate()} />
          {room.procedure && <ProcedureDoc p={room.procedure} />}
        </div>
      )}
      {room.status === "scheduled" && <TerminateButton target={target} who="party" onDone={() => void mutate()} className="mt-2 mr-4" />}
      {room.status === "scheduled" && (
        <button
          type="button"
          disabled={busy}
          className="mt-1 text-sm font-medium text-ink-soft underline decoration-rule hover:text-ink"
          onClick={() => {
            if (window.confirm("Mediatordan voz kechasizmi? Toʻlangan pul qaytariladi, yozishmalar va uchrashuvlar oʻchiriladi."))
              void act("drop-mediator/", {}, "Mediatordan voz kechildi");
          }}
        >
          Mediatordan voz kechish
        </button>
      )}
      {room.payment && !room.payment.respondent_paid_at && (
        <div className="mt-5">
          <PaymentCard payment={room.payment} party="respondent" target={target} onPaid={() => void mutate()} />
        </div>
      )}
      <div className="mt-5">
        <RoomTabs
          id="respondent"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "chat", label: "Suhbat", badge: room.threads[0]?.unread },
            { value: "uchrashuv", label: "Uchrashuvlar", badge: room.meetings.filter((m) => m.status === "proposed").length },
            { value: "kelishuv", label: "Kelishuv", badge: needsApproval ? 1 : 0 },
          ]}
        />
      </div>
      <div className="mt-5">
        {tab === "chat" && (
          <ChatPanel target={target} party="respondent" me="respondent" title={room.mediator.name} subtitle="Mediator · maxfiy suhbat" className="h-[520px]" />
        )}
        {tab === "uchrashuv" && <MeetingsPanel room={room} target={target} onChange={() => void mutate()} />}
        {tab === "kelishuv" && (
          <div className="space-y-3">
            <PartyApproval room={room} target={target} party="respondent" onChange={() => void mutate()} />
            {agreed && (
              <Button variant="outline" onClick={() => window.print()} className="no-print">
                <FileDown className="size-4" /> PDF sifatida saqlash
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
