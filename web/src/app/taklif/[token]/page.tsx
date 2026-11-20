"use client";

import { ArrowRight, Check, ChevronDown, FileQuestion, HeartHandshake, Wand2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { AiThinking } from "@/components/brand/ai-thinking";
import { Avatar } from "@/components/brand/bits";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { api, ApiError, errorText } from "@/lib/api";
import { RESPONDENT_QUESTIONS, SAMPLE_RESPONDENT_ANSWERS, takeDemoPrefill } from "@/lib/demo";
import { som } from "@/lib/format";
import { DISPUTE_LABEL } from "@/lib/labels";
import type { InvitePublic, Position } from "@/lib/types";

type Phase = "loading" | "missing" | "letter" | "q" | "thinking" | "accepted" | "declined" | "closed";
const ease = [0.16, 1, 0.3, 1] as const;

export default function TaklifPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [phase, setPhase] = useState<Phase>("loading");
  const [invite, setInvite] = useState<InvitePublic | null>(null);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [more, setMore] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api<InvitePublic>(`/invite/${token}/`)
      .then((inv) => {
        if (!alive) return;
        setInvite(inv);
        setPhase(inv.status === "invited" ? "letter" : inv.status === "declined" ? "declined" : "closed");
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) setPhase("missing");
        else {
          toast.error(errorText(e));
          setPhase("missing");
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  function startQuestions() {
    if (takeDemoPrefill("answers")) setAnswers([...SAMPLE_RESPONDENT_ANSWERS]);
    setPhase("q");
  }

  async function decline() {
    setBusy(true);
    try {
      await api(`/invite/${token}/respond/`, { body: { accept: false, position: null } });
      setPhase("declined");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setPhase("thinking");
    setDone(false);
    try {
      const position = await api<Position>("/ai/position/", {
        body: {
          role: "respondent",
          summary: invite?.invite_text ?? "",
          answers: RESPONDENT_QUESTIONS.map((q, i) => ({ q, a: answers[i] })),
        },
      });
      await api(`/invite/${token}/respond/`, { body: { accept: true, position } });
      setDone(true);
    } catch (e) {
      toast.error(errorText(e));
      setPhase("q");
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-2 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase === "q" ? `q${qi}` : phase}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease }}
          >
            {phase === "loading" && (
              <div className="mt-20 flex justify-center">
                <span className="size-7 animate-spin rounded-full border-2 border-accord border-t-transparent" />
              </div>
            )}

            {phase === "missing" && (
              <Centered icon={<FileQuestion className="size-7" />} title="Taklif topilmadi yoki muddati oʻtgan">
                Havolani toʻliq nusxalaganingizni tekshiring yoki taklif yuborgan odamdan yangisini soʻrang.
              </Centered>
            )}

            {phase === "letter" && invite && (
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-accord uppercase">Sizga mediatsiya taklifi</p>
                <h1 className="mt-2 text-[1.7rem] leading-tight font-semibold text-ink">
                  {invite.claimant_name} masalani tinch hal qilishni taklif qilmoqda
                </h1>
                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-ink-wash px-3 py-1 font-medium text-ink">{DISPUTE_LABEL[invite.dispute_type]}</span>
                  {invite.amount_uzs ? <span className="rounded-full bg-ink-wash px-3 py-1 font-medium text-ink tabular">{som(invite.amount_uzs)}</span> : null}
                  <span className="rounded-full bg-ink-wash px-3 py-1 font-mono text-xs leading-6 text-ink-soft">{invite.code}</span>
                </div>

                <div className="hujjat mt-5 p-5 pl-14">
                  <div className="mb-3 flex items-center gap-2.5">
                    <Avatar name={invite.claimant_name} className="size-9 text-xs" />
                    <p className="font-semibold text-ink">{invite.claimant_name}</p>
                  </div>
                  <p className="font-doc text-[1.08rem] leading-relaxed whitespace-pre-line text-ink">{invite.invite_text}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setMore((m) => !m)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-left font-medium text-ink"
                  aria-expanded={more}
                >
                  Mediatsiya nima?
                  <ChevronDown className={`size-4 transition-transform ${more ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {more && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-4 text-[0.95rem] leading-relaxed text-ink-soft"
                    >
                      <li className="pt-2">• Betaraf mediator ikki tomonga kelishuv topishda yordam beradi. U hukm chiqarmaydi.</li>
                      <li className="pt-1.5">• Hammasi maxfiy va ixtiyoriy. Istalgan payt toʻxtatishingiz mumkin.</li>
                      <li className="pt-1.5 pb-2">• Kelishuvga erishilmasa, sudga borish huquqingiz saqlanadi.</li>
                    </motion.ul>
                  )}
                </AnimatePresence>

                <div className="mt-6 grid gap-3">
                  <Button size="lg" variant="accord" onClick={startQuestions} disabled={busy}>
                    <HeartHandshake className="size-5" /> Rozi boʻlish
                  </Button>
                  <Button size="lg" variant="ghost" onClick={decline} disabled={busy} className="text-ink-soft">
                    <X className="size-4" /> Rad etish
                  </Button>
                </div>
              </div>
            )}

            {phase === "q" && (
              <div>
                <div className="mb-6 flex items-center gap-2">
                  {RESPONDENT_QUESTIONS.map((_, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= qi ? "bg-accord" : "bg-black/[0.07]"}`} />
                  ))}
                </div>
                <p className="text-sm font-medium text-ink-soft">
                  {qi + 1}-savol / {RESPONDENT_QUESTIONS.length}
                </p>
                <h2 className="mt-1.5 text-[1.55rem] leading-tight font-semibold text-ink">{RESPONDENT_QUESTIONS[qi]}</h2>
                <textarea
                  autoFocus
                  rows={5}
                  value={answers[qi]}
                  onChange={(e) => setAnswers((a) => a.map((x, i) => (i === qi ? e.target.value : x)))}
                  className="sheet mt-5 w-full resize-none p-4 text-[1.05rem] leading-relaxed text-ink outline-none focus:border-accord"
                  placeholder="Javobingizni yozing…"
                />
                {!answers[qi] && (
                  <button
                    type="button"
                    onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? SAMPLE_RESPONDENT_ANSWERS[i] : x)))}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-soft underline decoration-rule hover:text-ink"
                  >
                    <Wand2 className="size-3.5" /> Namuna javob
                  </button>
                )}
                <div className="mt-6 flex justify-between gap-3">
                  <Button variant="ghost" onClick={() => (qi === 0 ? setPhase("letter") : setQi(qi - 1))}>
                    Orqaga
                  </Button>
                  <Button
                    size="lg"
                    variant="accord"
                    disabled={answers[qi].trim().length < 3}
                    onClick={() => (qi < RESPONDENT_QUESTIONS.length - 1 ? setQi(qi + 1) : void finish())}
                  >
                    {qi < RESPONDENT_QUESTIONS.length - 1 ? "Keyingi" : "Yuborish"} <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {phase === "thinking" && (
              <AiThinking
                title="Javobingiz tayyorlanmoqda"
                steps={["Javoblar oʻqilmoqda", "Xohishlar va takliflar ajratilmoqda", "Mediator uchun saqlanmoqda"]}
                done={done}
                minMs={1800}
                onShown={() => setPhase("accepted")}
              />
            )}

            {phase === "accepted" && invite && <Accepted claimant={invite.claimant_name} />}

            {phase === "declined" && (
              <Centered icon={<X className="size-7" />} title="Javobingiz yuborildi">
                Siz taklifni rad etdingiz. Fikringiz oʻzgarsa, taklif yuborgan odam bilan bogʻlaning.
              </Centered>
            )}

            {phase === "closed" && (
              <Centered icon={<Check className="size-7" />} title="Bu taklifga allaqachon javob berilgan">
                Ish davom etmoqda. Mediator siz bilan bogʻlanadi.
              </Centered>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Centered({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-ink-wash text-ink">{icon}</span>
      <h1 className="mt-5 text-2xl font-semibold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">{children}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">Bosh sahifa</Link>
      </Button>
    </div>
  );
}

/** The bridge moment: the two sides slide toward the centre and meet. */
function Accepted({ claimant }: { claimant: string }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto mt-6 flex h-28 max-w-sm items-center justify-center">
        <motion.div initial={{ x: -110, opacity: 0 }} animate={{ x: -34, opacity: 1 }} transition={{ duration: 0.9, ease }} className="absolute">
          <Avatar name={claimant} className="size-16 text-base ring-4 ring-paper" />
        </motion.div>
        <motion.div initial={{ x: 110, opacity: 0 }} animate={{ x: 34, opacity: 1 }} transition={{ duration: 0.9, ease }} className="absolute">
          <span className="grid size-16 place-items-center rounded-full bg-accord text-white ring-4 ring-paper">
            <HeartHandshake className="size-7" />
          </span>
        </motion.div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.85, type: "spring", stiffness: 400, damping: 16 }}
          className="absolute top-1 grid size-8 place-items-center rounded-full bg-seal text-white"
        >
          <Check className="size-4" strokeWidth={3} />
        </motion.span>
      </div>
      <h1 className="mt-4 text-[1.8rem] font-semibold text-ink">Rahmat! Siz rozi boʻldingiz</h1>
      <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">Keyingi qadamlar:</p>
      <ol className="sheet mx-auto mt-4 max-w-sm space-y-3 p-5 text-left">
        {["Mediator tanlanadi va sizga vaqt yuboriladi", "Mediator ikkala tomon bilan uchrashadi", "Kelishuv yozma ravishda rasmiylashtiriladi"].map((t, i) => (
          <li key={t} className="flex items-start gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accord-tint text-xs font-bold text-accord">{i + 1}</span>
            <span className="text-ink">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
