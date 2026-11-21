"use client";

import { ArrowLeft, FileDown, FileSignature, PenLine, Send, Sparkles, Stamp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { cn } from "cn";
import { AiThinking } from "@/components/brand/ai-thinking";
import { Seal } from "@/components/brand/seal";
import { BriefCard } from "@/components/case/agreement";
import { ApprovalStatus } from "@/components/room/approval";
import { MediatorInbox } from "@/components/room/inbox";
import { MeetingsPanel } from "@/components/room/meetings";
import { RoomTabs } from "@/components/room/tabs";
import { CaseHeader, PositionCard, Timeline } from "@/components/case/parts";
import { MediatorPaymentCard } from "@/components/case/payment";
import { ProcedureDoc, TermCard, TerminateButton } from "@/components/case/procedure";
import { AppShell } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { api, errorText } from "@/lib/api";
import { useRoom } from "@/lib/rooms";
import type { Agreement, Brief, Case } from "@/lib/types";

export default function MediatorCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell roles={["mediator", "admin"]} wide>
      <Workspace id={id} />
    </AppShell>
  );
}

type Stage = "idle" | "briefing" | "editing" | "sealing";

// Art. 29: what a mediative agreement must (and may) say. The parties' full names and addresses are added
// from their approvals, so the mediator writes only the substance. Fields start empty: the mediator drafts it.
const FIELDS = [
  { key: "rights", title: "1. Tomonlarning huquq va majburiyatlari", hint: "Kim nima qiladi va nimadan voz kechadi.", required: true },
  { key: "terms", title: "2. Bajarish shartlari va muddatlari", hint: "Summa, jadval, sanalar, toʻlov usuli.", required: true },
  { key: "consequences", title: "3. Bajarilmaslik oqibatlari", hint: "Ixtiyoriy: tomonlar kelishsa belgilanadi.", required: false },
] as const;
type FieldKey = (typeof FIELDS)[number]["key"];
const EMPTY: Record<FieldKey, string> = { rights: "", terms: "", consequences: "" };
const LAW = "https://lex.uz/docs/-3805227";
type Tab = "ish" | "chat" | "uchrashuv";

function Workspace({ id }: { id: string }) {
  const router = useRouter();
  const { data: c, mutate } = useSWR<Case>(`/cases/${id}/`, (p: string) => api<Case>(p), { refreshInterval: 5000 });
  const [stage, setStage] = useState<Stage>("idle");
  const [ready, setReady] = useState(false);
  const [pendingBrief, setPendingBrief] = useState<Brief | null>(null);
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("ish");
  const { data: room, mutate: refreshRoom } = useRoom(c?.mediator ? { kind: "case", id } : null);

  if (!c) return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  const brief = c.brief ?? pendingBrief;
  const formReady = FIELDS.every((f) => !f.required || form[f.key].trim().length >= 10);

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

  /** Re-open a sent draft: clauses with our titles go back to their field, anything else lands in the first one. */
  function startEdit() {
    if (!c?.agreement) return;
    const next: Record<FieldKey, string> = { ...EMPTY };
    const other: string[] = [];
    for (const cl of c.agreement.clauses) {
      const f = FIELDS.find((x) => x.title === cl.title);
      if (f) next[f.key] = cl.body;
      else other.push(`${cl.title}: ${cl.body}`);
    }
    if (other.length) next.rights = [...other, next.rights].filter(Boolean).join("\n\n");
    setForm(next);
    setStage("editing");
  }

  async function sendForApproval() {
    if (!c || !formReady) return;
    const agreement: Agreement = {
      title: `Mediativ kelishuv № ${c.code}`,
      clauses: FIELDS.filter((f) => form[f.key].trim()).map((f) => ({ title: f.title, body: form[f.key].trim() })),
      citations: [
        { article: "29-modda", title: "Mediativ kelishuv", url: LAW },
        { article: "29¹-modda", title: "Mediativ kelishuvni ijro etish", url: LAW },
      ],
      source: "mediator",
    };
    setBusy(true);
    try {
      const u = await api<Case>(`/cases/${c.id}/`, { method: "PATCH", body: { agreement } });
      await mutate(u, { revalidate: false });
      setStage("idle");
      void refreshRoom();
      toast.success("Loyiha ikkala tomonga tasdiqlash uchun yuborildi");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function seal() {
    if (!c) return;
    setBusy(true);
    try {
      const u = await api<Case>(`/cases/${c.id}/`, { method: "PATCH", body: { status: "agreed" } });
      setStage("sealing");
      await mutate(u, { revalidate: false });
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function refuse() {
    if (!window.confirm("Ishni rad etasizmi? Taraflar toʻlagan pul toʻliq qaytariladi, ish sizning roʻyxatingizdan chiqadi.")) return;
    try {
      await api(`/rooms/${id}/refuse/`, { body: {} });
      toast.success("Ish rad etildi, taraflar boshqa mediator tanlaydi");
      router.push("/mediator");
    } catch (e) {
      toast.error(errorText(e));
    }
  }

  const agreed = c.status === "agreed" || c.status === "closed";
  const draftSent = !!c.agreement && !agreed;
  const bothApproved = !!room && (["claimant", "respondent"] as const).every((p) => room.approvals[p]?.current && room.approvals[p]?.decision === "approved");
  const unread = room?.threads.reduce((n, t) => n + t.unread, 0) ?? 0;
  const pending = room?.meetings.filter((m) => m.status === "proposed").length ?? 0;

  return (
    <div>
      <Link href="/mediator" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Ishlar
      </Link>
      <CaseHeader item={c} />

      {room && (
        <div className="mt-6">
          <RoomTabs
            id="mediator"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "ish", label: "Ish va kelishuv" },
              { value: "chat", label: "Suhbatlar", badge: unread },
              { value: "uchrashuv", label: "Uchrashuvlar", badge: pending },
            ]}
          />
        </div>
      )}
      {room && tab === "chat" && (
        <div className="mt-6">
          <MediatorInbox room={room} target={{ kind: "case", id }} />
        </div>
      )}
      {room && tab === "uchrashuv" && (
        <div className="mt-6">
          <MeetingsPanel room={room} target={{ kind: "case", id }} onChange={() => void refreshRoom()} />
        </div>
      )}

      <div className={cn("mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]", room && tab !== "ish" && "hidden")}>
        <div className="space-y-6">
          {/* 1. The agreement, written by the mediator (open from the start, nothing to unlock) */}
          {c.status === "scheduled" && stage !== "sealing" && (!draftSent || stage === "editing") && (
            <section className="sheet p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <FileSignature className="size-5 text-accord" />
                <h2 className="text-xl font-semibold text-ink">Mediativ kelishuv</h2>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                Taraflar: {c.claimant.name} va {c.respondent.name || "ikkinchi tomon"}. Toʻliq F.I.Sh. va manzillarini ular tasdiqlashda oʻzlari kiritadi (29-modda).
              </p>
              <div className="mt-5 space-y-4">
                {FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="font-doc font-semibold text-ink">{f.title}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{f.hint}</span>
                    <textarea
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      rows={4}
                      className="mt-1.5 w-full resize-y rounded-xl border border-rule bg-paper/60 p-3 font-doc text-[1.02rem] leading-relaxed text-ink outline-none focus:border-accord"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                {stage === "editing" && (
                  <Button variant="ghost" onClick={() => setStage("idle")}>
                    Bekor qilish
                  </Button>
                )}
                <Button size="lg" variant="accord" disabled={busy || !formReady} onClick={sendForApproval}>
                  <Send className="size-5" /> {busy ? "Yuborilmoqda…" : "Tomonlarga tasdiqlashga yuborish"}
                </Button>
              </div>
            </section>
          )}

          {/* 2b. Waiting for both parties */}
          {draftSent && stage !== "editing" && stage !== "sealing" && c.agreement && (
            <section className="sheet p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <FileSignature className="size-5 text-accord" />
                <h2 className="text-xl font-semibold text-ink">Tomonlar tasdigʻi</h2>
              </div>
              <p className="mt-1 text-ink-soft">Loyiha ikkala tomonga yuborildi. Ikkalasi ham tasdiqlagachgina kelishuv muhrlanadi.</p>
              <div className="mt-4">{room ? <ApprovalStatus room={room} /> : <div className="h-10 animate-pulse rounded-xl bg-muted" />}</div>
              <div className="mt-4 rounded-xl border border-rule bg-paper/60 p-4 font-doc text-ink">
                <p className="font-semibold">{c.agreement.title}</p>
                <ol className="mt-2 space-y-1.5 text-[0.95rem]">
                  {c.agreement.clauses.map((cl) => (
                    <li key={cl.title}>
                      <b>{cl.title}</b> {cl.body}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-5 flex flex-wrap justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={startEdit}
                >
                  <PenLine className="size-4" /> Loyihani tahrirlash
                </Button>
                <Button size="lg" variant="accord" disabled={busy || !bothApproved} onClick={seal} title={bothApproved ? undefined : "Ikkala tomon tasdiqlashi kerak"}>
                  <Stamp className="size-5" /> {busy ? "Saqlanmoqda…" : bothApproved ? "Yakunlash va muhrlash" : "Tasdiqlar kutilmoqda"}
                </Button>
              </div>
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
          {(c.claimant_position || c.respondent_position) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {c.claimant_position && <PositionCard title="Murojaatchi" name={c.claimant.name} data={c.claimant_position} tone="ink" />}
              {c.respondent_position && <PositionCard title="Ikkinchi tomon" name={c.respondent.name} data={c.respondent_position} tone="accord" />}
            </div>
          )}
          {/* Optional helper: never blocks the mediator's work */}
          {stage === "briefing" ? (
            <AiThinking
              title="AI maʼlumotnoma tayyorlamoqda"
              steps={["Tomonlar pozitsiyasi oʻqilmoqda", "Faktlar ajratilmoqda", "Umumiy nuqtalar qidirilmoqda"]}
              done={ready}
              minMs={2200}
              onShown={() => setStage("idle")}
            />
          ) : brief ? (
            <BriefCard brief={brief} />
          ) : (
            !agreed &&
            c.status === "scheduled" && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-rule p-4">
                <p className="text-sm text-ink-soft">Ixtiyoriy: AI tomonlar pozitsiyasidan qisqa maʼlumotnoma tuzib beradi.</p>
                <Button variant="outline" size="sm" onClick={makeBrief}>
                  <Sparkles className="size-4" /> AI maʼlumotnoma
                </Button>
              </section>
            )
          )}
          {c.procedure && <ProcedureDoc p={c.procedure} />}
        </div>

        <aside className="space-y-6">
          {c.status === "terminated" && (
            <p className="rounded-2xl border border-rule bg-muted p-4 text-ink">
              <b>Mediatsiya tugatildi.</b> {[...c.events].reverse().find((e) => e.kind.startsWith("terminated_"))?.label}
              {c.termination_reason ? `: «${c.termination_reason}»` : ""}
            </p>
          )}
          {c.status === "scheduled" && <TermCard room={c} />}
          {c.status === "scheduled" && (
            <div className="sheet space-y-2 p-5">
              <p className="text-sm text-ink-soft">
                Mustaqilligingiz yoki xolisligingizga taʼsir qiluvchi holat boʻlsa (masalan, taraflardan biri bilan qarindoshlik), ishni rad etishingiz shart (9, 25-moddalar).
                Taraflarga toʻlangan pul toʻliq qaytariladi (28-modda).
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button size="sm" variant="outline" onClick={refuse}>
                  Ishni rad etish
                </Button>
                <TerminateButton target={{ kind: "case", id }} who="mediator" onDone={() => void mutate()} />
              </div>
            </div>
          )}
          {c.payment && <MediatorPaymentCard payment={c.payment} />}
          <section className={cn("sheet p-5")}>
            <h2 className="mb-4 text-lg font-semibold text-ink">Jarayon</h2>
            <Timeline events={c.events} />
          </section>
        </aside>
      </div>
    </div>
  );
}
