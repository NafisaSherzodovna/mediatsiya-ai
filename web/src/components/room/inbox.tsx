"use client";

import { MessagesSquare } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Avatar } from "@/components/brand/bits";
import { hhmmTashkent } from "@/lib/format";
import { PARTY_TITLE, type RoomTarget } from "@/lib/rooms";
import type { Room, RoomParty } from "@/lib/types";
import { ChatPanel } from "./chat";

const ago = hhmmTashkent;

/** Mediator's messenger: two private chats (one per party) side by side with the conversation. */
export function MediatorInbox({ room, target }: { room: Room; target: RoomTarget }) {
  const [active, setActive] = useState<RoomParty | null>(null);
  const current = active ?? "claimant";
  return (
    <div className="grid gap-3 md:grid-cols-[280px_1fr]">
      <aside className={cn("overflow-hidden rounded-2xl border border-rule bg-white shadow-[var(--shadow-sheet)]", active && "hidden md:block")}>
        <p className="flex items-center gap-2 border-b border-rule px-4 py-3 text-sm font-semibold text-ink">
          <MessagesSquare className="size-4 text-accord" /> Suhbatlar
        </p>
        <ul>
          {room.threads.map((t) => (
            <li key={t.party}>
              <button
                type="button"
                onClick={() => setActive(t.party)}
                className={cn(
                  "flex w-full items-center gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors",
                  current === t.party ? "border-accord bg-accord-tint/60" : "border-transparent hover:bg-muted/60",
                )}
              >
                <Avatar name={t.name} className="size-11 text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{t.name}</span>
                    {t.last && <span className="shrink-0 text-[0.7rem] text-ink-soft">{ago(t.last.at)}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink-soft">
                      {t.last ? `${t.last.sender === "mediator" ? "Siz: " : ""}${t.last.text}` : PARTY_TITLE[t.party]}
                    </span>
                    {t.unread > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accord px-1.5 text-[0.7rem] font-bold text-white">{t.unread}</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-rule px-4 py-3 text-xs leading-relaxed text-ink-soft">
          Har bir tomon bilan alohida, maxfiy suhbat. Tomonlar bir-birining yozishmasini koʻrmaydi.
        </p>
      </aside>
      <div className={cn(!active && "hidden md:block")}>
        <ChatPanel
          key={current}
          target={target}
          party={current}
          me="mediator"
          title={room.names[current]}
          subtitle={`${PARTY_TITLE[current]} · ${room.code}`}
          onBack={() => setActive(null)}
        />
      </div>
    </div>
  );
}
