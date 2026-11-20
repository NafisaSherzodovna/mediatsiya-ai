"use client";

import { ArrowLeft, Check, FileDown, FileSignature, Plus, Sparkles, Stamp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { cn } from "cn";
import { AiThinking } from "@/components/brand/ai-thinking";
import { AiSourceChip } from "@/components/brand/bits";
import { Seal } from "@/components/brand/seal";
import { BriefCard } from "@/components/case/agreement";
import { CaseHeader, PositionCard, Timeline } from "@/components/case/parts";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import type { Agreement, Brief, Case } from "@/lib/types";

export default function MediatorCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell roles={["mediator", "admin"]} wide>
      <Workspace id={id} />
    </AppShell>
  );
}

type Stage = "idle" | "briefing" | "drafting" | "editing" | "sealing";

function Workspace({ id }: { id: string }) {
  const { data: c, mutate } = useSWR<Case>(`/cases/${id}/`, (p: string) => api<Case>(p));
  const [stage, setStage] = useState<Stage>("idle");
  const [ready, setReady] = useState(false);
  const [pendingBrief, setPendingBrief] = useState<Brief | null>(null);
  const [terms, setTerms] = useState<string[] | null>(null);
  const [newTerm, setNewTerm] = useState("");
  const [draft, setDraft] = useState<Agreement | null>(null);
  const [busy, setBusy] = useState(false);

  if (!c) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  const brief = c.brief ?? pendingBrief;
  const activeTerms = terms ?? (brief ? [brief.zopa, ...brief.suggested_options.slice(0, 1)] : []);

  async function makeBrief() {
    if (!c) return;
    setStage("briefing");
    setReady(false);
    try {
      const b = await api<Brief>("/ai/brief/", {
        body: {
          summary: c.classification?.summary ?? c.description,
          dispute_type: c.dispute_type,
          amount_uzs: c.amount_uzs,
          claimant_position: c.claimant_position,
          respondent_position: c.respondent_position,
        },
      });
      setPendingBrief(b);
      setReady(true);
      void api<Case>(`/cases/${c.id}/`, { method: "PATCH", body: { brief: b } }).then((u) => mutate(u, { revalidate: false }));
    } catch (e) {
      toast.error(errorText(e));
      setStage("idle");
    }
  }

  async function makeDraft() {
    if (!c || !brief) return;
    setStage("drafting");
    setReady(false);
    try {
      const a = await api<Agreement>("/ai/agreement/", {
        body: {
          code: c.code,
          summary: c.description,
          claimant_name: c.claimant.name,
          respondent_name: c.respondent.name,
          dispute_type: c.dispute_type,
          amount_uzs: c.amount_uzs,
          brief,
          terms: activeTerms,
        },
      });
      setDraft(a);
      setReady(true);
    } catch (e) {
      toast.error(errorText(e));
      setStage("idle");
    }
  }

  async function seal() {
    if (!c || !draft) return;
    setBusy(true);
    try {
      const u = await api<Case>(`/cases/${c.id}/`, { method: "PATCH", body: { agreement: draft, status: "agreed" } });
      setStage("sealing");
      await mutate(u, { revalidate: false });
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const agreed = c.status === "agreed" || c.status === "closed";

  return (
    <div>
      <Link href="/mediator" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Ishlar
      </Link>
      <CaseHeader item={c} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* 1. Brief */}
          {stage === "briefing" ? (
            <AiThinking
              title="AI maʼlumotnoma tayyorlamoqda"
              steps={["Tomonlar pozitsiyasi oʻqilmoqda", "Faktlar ajratilmoqda", "Umumiy nuqtalar qidirilmoqda", "Kelishuv oraligʻi hisoblanmoqda"]}
              done={ready}
              minMs={2200}
              onShown={() => setStage("idle")}
            />
          ) : brief ? (
            <BriefCard brief={brief} />
          ) : (
            <section className="sheet flex flex-col items-start gap-3 p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-accord-tint text-accord">
                <Sparkles className="size-5" />
              </span>
              <h2 className="text-xl font-semibold text-ink">Sessiyaga tayyorgarlik</h2>
              <p className="text-ink-soft">AI ikkala tomon pozitsiyasidan 1 sahifalik maʼlumotnoma tuzadi: faktlar, umumiy nuqtalar va kelishuv oraligʻi.</p>
              <Button variant="accord" size="lg" onClick={makeBrief}>
                <Sparkles className="size-4" /> AI maʼlumotnoma
              </Button>
            </section>
          )}

          {/* 2. Agreement */}
          {brief && !agreed && stage !== "sealing" && stage !== "briefing" && (
            <section className="sheet p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <FileSignature className="size-5 text-accord" />
                <h2 className="text-xl font-semibold text-ink">Kelishuv loyihasi</h2>
              </div>
              {stage === "drafting" ? (
                <AiThinking
                  className="mt-4 shadow-none"
                  title="AI kelishuv yozmoqda"
                  steps={["Shartlar tartiblanmoqda", "Qonun talablari tekshirilmoqda", "Bandlar yozilmoqda"]}
                  done={ready}
                  minMs={2000}
                  onShown={() => setStage("editing")}
                />
              ) : draft && stage === "editing" ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full bg-transparent font-doc text-lg font-semibold text-ink outline-none"
                      aria-label="Kelishuv nomi"
                    />
                    <AiSourceChip source={draft.source} />
                  </div>
                  {draft.clauses.map((cl, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <p className="font-doc font-semibold text-ink">{cl.title}</p>
                      <textarea
                        value={cl.body}
                        rows={Math.max(2, Math.ceil(cl.body.length / 80))}
                        onChange={(e) =>
                          setDraft({ ...draft, clauses: draft.clauses.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })
                        }
                        className="mt-1 w-full resize-y rounded-xl border border-rule bg-paper/60 p-3 font-doc text-[1.02rem] leading-relaxed text-ink outline-none focus:border-accord"
                      />
                    </motion.div>
                  ))}
                  <div className="flex flex-wrap justify-between gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setStage("idle")}>
                      Shartlarni oʻzgartirish
                    </Button>
                    <Button size="lg" variant="accord" disabled={busy} onClick={seal}>
                      <Stamp className="size-5" /> {busy ? "Saqlanmoqda…" : "Yakunlash va muhrlash"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-ink-soft">Sessiyada kelishilgan shartlarni belgilang. AI ulardan qonunga mos kelishuv loyihasini tuzadi.</p>
                  <div className="mt-4 space-y-2">
                    {activeTerms.map((t, i) => (
                      <div key={`${t}-${i}`} className="flex items-start gap-2 rounded-xl border border-accord/30 bg-accord-tint px-3 py-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-accord" />
                        <p className="flex-1 text-[0.95rem] text-ink">{t}</p>
                        <button type="button" aria-label="Olib tashlash" onClick={() => setTerms(activeTerms.filter((_, j) => j !== i))}>
                          <X className="size-4 text-ink-soft hover:text-ink" />
                        </button>
                      </div>
                    ))}
                    {brief.suggested_options
                      .filter((o) => !activeTerms.includes(o))
                      .map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => setTerms([...activeTerms, o])}
                          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-rule px-3 py-2.5 text-left text-[0.95rem] text-ink-soft hover:border-accord/40 hover:text-ink"
                        >
                          <Plus className="size-4" /> {o}
                        </button>
                      ))}
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newTerm.trim()) setTerms([...activeTerms, newTerm.trim()]);
                        setNewTerm("");
                      }}
                    >
                      <input
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        placeholder="Oʻz shartingizni yozing…"
                        className="h-11 flex-1 rounded-xl border border-input bg-white px-3 text-ink outline-none focus:border-accord"
                      />
                      <Button type="submit" variant="outline">
                        Qoʻshish
                      </Button>
                    </form>
                  </div>
                  <Button size="lg" variant="accord" className="mt-5" disabled={activeTerms.length === 0} onClick={makeDraft}>
                    <Sparkles className="size-4" /> Kelishuv loyihasini tuzish
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* 3. Sealed */}
          <AnimatePresence>
            {(agreed || stage === "sealing") && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-accord/30 bg-[radial-gradient(600px_220px_at_50%_0%,var(--accord-tint),#fff)] p-6 text-center"
              >
                <div className="relative flex justify-center">
                  <Seal stamped={stage === "sealing"} sub={c.code} className="relative size-36" delay={0.15} />
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Kelishuvga erishildi</h2>
                <p className="mx-auto mt-1 max-w-md text-ink-soft">Kelishuv saqlandi. Tomonlar uni PDF koʻrinishida olishi mumkin.</p>
                <Button asChild size="lg" variant="accord" className="mt-5">
                  <Link href={`/ishlar/${c.id}/kelishuv`}>
                    <FileDown className="size-5" /> Kelishuv (PDF)
                  </Link>
                </Button>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-6">
          {c.claimant_position && <PositionCard title="Murojaatchi" name={c.claimant.name} data={c.claimant_position} tone="ink" />}
          {c.respondent_position && <PositionCard title="Ikkinchi tomon" name={c.respondent.name} data={c.respondent_position} tone="accord" />}
          <section className={cn("sheet p-5")}>
            <h2 className="mb-4 text-lg font-semibold text-ink">Jarayon</h2>
            <Timeline events={c.events} />
          </section>
        </aside>
      </div>
    </div>
  );
}
