"use client";

import { ArrowUp, BookOpenText, ExternalLink, ScrollText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AiThinking } from "@/components/brand/ai-thinking";
import { AiSourceChip } from "@/components/brand/bits";
import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import type { AskAnswer } from "@/lib/types";

const SUGGESTED = [
  "Mediativ kelishuv bajarilmasa nima boʻladi?",
  "Mediator haqi qancha, bepul boʻlishi mumkinmi?",
  "Mediatsiya qancha muddatda tugashi kerak?",
  "Kim mediator boʻla oladi?",
  "Suhbatlar maxfiy qoladimi?",
];

type Item = { q: string; a: AskAnswer | null; done: boolean; shown: boolean };

/** Public law Q&A: answers only from the Law "On Mediation", with article citations. */
export default function HuquqPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const busy = items.some((i) => !i.shown);

  async function ask(question: string) {
    const text = question.trim();
    if (text.length < 5 || busy) return;
    setQ("");
    setItems((list) => [{ q: text, a: null, done: false, shown: false }, ...list]);
    try {
      const a = await api<AskAnswer>("/ai/ask/", { body: { question: text } });
      setItems((list) => list.map((it, i) => (i === 0 ? { ...it, a, done: true } : it)));
    } catch (e) {
      toast.error(errorText(e));
      setItems((list) => list.slice(1));
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-20">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accord uppercase">
          <ScrollText className="size-4" /> Huquqiy yordamchi
        </p>
        <h1 className="mt-2 text-[2rem] leading-tight font-semibold text-ink sm:text-[2.4rem]">Mediatsiya qonuni boʻyicha savol bering</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          AI faqat «Mediatsiya toʻgʻrisida»gi Qonun matniga tayanadi (2025-yil 20-oktyabrdagi oʻzgartishlar bilan) va har bir javobda moddani
          koʻrsatadi. Bu huquqiy maslahat emas.
        </p>

        <form
          className="sheet mt-6 flex items-end gap-2 p-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(q);
          }}
        >
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(q);
              }
            }}
            rows={2}
            placeholder="Masalan: mediativ kelishuvni sud orqali ijro ettirsa boʻladimi?"
            className="min-h-14 flex-1 resize-none bg-transparent px-2 py-1.5 text-[1.02rem] text-ink outline-none placeholder:text-ink-soft/60"
            aria-label="Savol"
          />
          <Button type="submit" size="icon" variant="accord" disabled={busy || q.trim().length < 5} aria-label="Yuborish">
            <ArrowUp className="size-5" />
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => void ask(s)}
              className="rounded-full border border-rule bg-white px-3 py-1.5 text-sm text-ink transition-colors hover:border-accord/50 hover:bg-accord-tint disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          <AnimatePresence initial={false}>
            {items.map((it, i) => (
              <motion.div key={`${it.q}-${items.length - i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} layout>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-white">{it.q}</p>
                <div className="mt-3">
                  {!it.shown ? (
                    <AiThinking
                      title="Qonundan qidirilmoqda"
                      steps={["Savol tahlil qilinmoqda", "Tegishli moddalar topilmoqda", "Javob yozilmoqda"]}
                      done={it.done}
                      minMs={1500}
                      onShown={() => setItems((list) => list.map((x) => (x === it ? { ...x, shown: true } : x)))}
                    />
                  ) : (
                    it.a && <Answer a={it.a} />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-rule p-5 text-ink-soft">
              <BookOpenText className="size-5 shrink-0" /> 41 ta modda: tamoyillar, mediator talablari, muddatlar, maxfiylik, mediativ kelishuv va uning ijrosi.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Answer({ a }: { a: AskAnswer }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="hujjat p-5 pl-14">
      <div className="mb-2 flex justify-end">
        <AiSourceChip source={a.source} />
      </div>
      <p className="font-doc text-[1.08rem] leading-relaxed text-ink">{a.answer}</p>
      {a.citations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-3">
          {a.citations.map((c) => (
            <a
              key={c.article}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-seal-tint px-3 py-1 text-xs font-semibold text-seal hover:underline"
            >
              {c.article}
              {c.title ? ` · ${c.title}` : ""} <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}
