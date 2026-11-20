"use client";

import { ArrowLeft, Check, CheckCheck, Lock, SendHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Avatar } from "@/components/brand/bits";
import { errorText } from "@/lib/api";
import { hhmmTashkent, tashkent, tashkentDay } from "@/lib/format";
import { roomApi, useMessages, type RoomTarget } from "@/lib/rooms";
import type { RoomMessage, RoomParty } from "@/lib/types";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];

function dayLabel(iso: string) {
  const p = tashkent(iso);
  const ymd = `${p.y}-${String(p.mo + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
  if (ymd === tashkentDay(0).ymd) return "Bugun";
  if (ymd === tashkentDay(-1).ymd) return "Kecha";
  return `${p.d}-${MONTHS[p.mo]}`;
}

const hhmm = hhmmTashkent;

/**
 * Messenger-style conversation between the mediator and one party.
 * `me` is who is looking ("mediator" or the party); `party` picks the private chat.
 */
export function ChatPanel({
  target,
  party,
  me,
  title,
  subtitle,
  onBack,
  className,
}: {
  target: RoomTarget;
  party: RoomParty;
  me: "mediator" | RoomParty;
  title: string;
  subtitle: string;
  onBack?: () => void;
  className?: string;
}) {
  const { data, mutate } = useMessages(target, party);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const count = data?.length ?? 0;

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: count > 0 ? "smooth" : "auto" });
  }, [count]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(140, el.scrollHeight)}px`;
  }, [text]);

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    const temp: RoomMessage = { id: `tmp-${Date.now()}`, party, sender: me, text: t, at: new Date().toISOString() };
    setText("");
    await mutate(async (cur) => {
      try {
        const saved = await roomApi.send(target, party, t);
        return [...(cur ?? []), saved];
      } catch (e) {
        toast.error(errorText(e));
        setText(t);
        return cur;
      }
    }, { optimisticData: [...(data ?? []), temp], rollbackOnError: true, revalidate: false });
    setSending(false);
    input.current?.focus();
  }

  // group by day
  const groups: { day: string; items: RoomMessage[] }[] = [];
  for (const m of data ?? []) {
    const day = dayLabel(m.at);
    if (groups.at(-1)?.day !== day) groups.push({ day, items: [] });
    groups.at(-1)!.items.push(m);
  }

  return (
    <div className={cn("flex h-[560px] max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-rule bg-white shadow-[var(--shadow-sheet)]", className)}>
      <header className="flex items-center gap-3 border-b border-rule bg-white/90 px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="-ml-1 rounded-lg p-1.5 text-ink-soft hover:bg-ink-wash md:hidden" aria-label="Orqaga">
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div className="relative">
          <Avatar name={title} className="size-10 text-xs" />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-accord" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-semibold text-ink">{title}</p>
          <p className="truncate text-xs text-ink-soft">{subtitle}</p>
        </div>
        <span className="hidden items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft sm:inline-flex">
          <Lock className="size-3" /> Maxfiy suhbat
        </span>
      </header>

      <div
        ref={scroller}
        className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f7f5ef,#f3f6f5)] px-3 py-4 sm:px-5"
        aria-live="polite"
      >
        {!data && <p className="mt-10 text-center text-sm text-ink-soft">Yuklanmoqda…</p>}
        {data && data.length === 0 && (
          <div className="mx-auto mt-10 max-w-xs rounded-2xl bg-white/80 p-4 text-center text-sm text-ink-soft">
            Suhbat hali boshlanmagan. Bu yerda yozilganlarni faqat siz va {me === "mediator" ? "shu tomon" : "mediator"} koʻradi.
          </div>
        )}
        {groups.map((g) => (
          <div key={g.day} className="space-y-1.5">
            <div className="sticky top-0 z-10 flex justify-center py-1">
              <span className="rounded-full bg-white/90 px-3 py-0.5 text-[0.7rem] font-medium text-ink-soft shadow-sm">{g.day}</span>
            </div>
            <AnimatePresence initial={false}>
              {g.items.map((m, i) => {
                const mine = m.sender === me;
                const prev = g.items[i - 1];
                const tail = !prev || prev.sender !== m.sender;
                const pending = String(m.id).startsWith("tmp-");
                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    className={cn("flex", mine ? "justify-end" : "justify-start", tail && "pt-1.5")}
                  >
                    <div
                      className={cn(
                        "relative max-w-[82%] px-3.5 pt-2 pb-1.5 text-[0.95rem] leading-snug shadow-sm sm:max-w-[70%]",
                        mine ? "rounded-2xl bg-accord text-white" : "rounded-2xl bg-white text-ink",
                        tail && (mine ? "rounded-br-md" : "rounded-bl-md"),
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{m.text}</p>
                      <span className={cn("mt-0.5 flex items-center justify-end gap-1 text-[0.68rem]", mine ? "text-white/75" : "text-ink-soft")}>
                        {hhmm(m.at)}
                        {mine && (pending ? <Check className="size-3" /> : <CheckCheck className="size-3" />)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <form
        className="flex items-end gap-2 border-t border-rule bg-white p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Xabar yozing…"
          className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-[0.95rem] text-ink outline-none placeholder:text-ink-soft/70 focus:bg-white focus:ring-2 focus:ring-accord/30"
          aria-label="Xabar"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accord text-white shadow-[0_6px_16px_-8px_rgb(15_118_110/0.8)] transition-transform hover:scale-105 disabled:scale-100 disabled:opacity-40"
          aria-label="Yuborish"
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}
