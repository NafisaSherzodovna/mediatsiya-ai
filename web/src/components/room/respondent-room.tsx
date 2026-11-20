"use client";

import { FileDown, Hourglass, Scale } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

  if (!room) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />;

  if (!room.mediator) {
    return (
      <div className="mt-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-warn-tint text-[#7a4f12]">
          <Hourglass className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Mediator tanlanmoqda</h1>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">
          Siz rozi boʻldingiz. {room.names.claimant} mediatorni tanlagach, shu havolada mediator bilan suhbat va uchrashuvlar ochiladi.
        </p>
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
