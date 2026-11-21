"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AiThinking } from "@/components/brand/ai-thinking";
import {
  ClassifyStep,
  CompareStep,
  DescribeStep,
  InviteStep,
  RespondentStep,
  SentStep,
  StepHeading,
  Stepper,
} from "@/components/intake/steps";
import { AppShell } from "@/components/shell/app-header";
import { api, errorText } from "@/lib/api";
import { useUser } from "@/lib/auth";
import { SAMPLE_VOICE, takeDemoPrefill } from "@/lib/demo";
import type { AiInvite, Case, Classification, Comparison, Region } from "@/lib/types";

type Phase =
  | "describe"
  | "classifying"
  | "classified"
  | "comparing"
  | "compared"
  | "respondent"
  | "inviting"
  | "invite"
  | "sent";

const STEP_OF: Record<Phase, number> = {
  describe: 0,
  classifying: 1,
  classified: 1,
  comparing: 2,
  compared: 2,
  respondent: 3,
  inviting: 4,
  invite: 4,
  sent: 5,
};

export default function MurojaatPage() {
  return (
    <AppShell roles={["claimant"]}>
      <Wizard />
    </AppShell>
  );
}

function Wizard() {
  const { user } = useUser();
  const [phase, setPhase] = useState<Phase>("describe");
  // Wizard renders only after the client-side role check, so reading localStorage here is safe.
  const [prefilled] = useState(() => typeof window !== "undefined" && takeDemoPrefill("voice"));
  const [text, setText] = useState(prefilled ? SAMPLE_VOICE : "");
  // No default region: the claimant picks one (the stage demo prefills Toshkent so it never stalls)
  const [region, setRegion] = useState<Region | "">(prefilled ? "toshkent-sh" : "");
  const [classification, setClassification] = useState<Classification | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("+998 ");
  const [invite, setInvite] = useState<AiInvite | null>(null);
  const [inviteText, setInviteText] = useState("");
  const [created, setCreated] = useState<Case | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const go = (p: Phase) => {
    setReady(false);
    setPhase(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function classify() {
    go("classifying");
    try {
      const c = await api<Classification>("/ai/classify/", { body: { text } });
      setClassification(c);
      setReady(true);
    } catch (e) {
      toast.error(errorText(e));
      go("describe");
    }
  }

  async function compare() {
    if (!classification) return;
    go("comparing");
    try {
      const c = await api<Comparison>("/ai/compare/", {
        body: { dispute_type: classification.dispute_type, amount_uzs: classification.amount_uzs },
      });
      setComparison(c);
      setReady(true);
    } catch (e) {
      toast.error(errorText(e));
      go("classified");
    }
  }

  async function writeInvite() {
    if (!classification) return;
    go("inviting");
    try {
      const inv = await api<AiInvite>("/ai/invite/", {
        body: {
          claimant_name: user?.name ?? "",
          respondent_name: rName.trim(),
          dispute_type: classification.dispute_type,
          amount_uzs: classification.amount_uzs,
          summary: classification.summary,
        },
      });
      setInvite(inv);
      setInviteText(inv.text);
      setReady(true);
    } catch (e) {
      toast.error(errorText(e));
      go("respondent");
    }
  }

  async function send() {
    if (!classification) return;
    setBusy(true);
    try {
      const c = await api<Case>("/cases/", {
        body: {
          description: text.trim(),
          dispute_type: classification.dispute_type,
          region,
          amount_uzs: classification.amount_uzs,
          respondent: { name: rName.trim(), phone: rPhone.replace(/\s/g, "") },
          classification,
          comparison,
          invite_text: inviteText.trim(),
        },
      });
      setCreated(c);
      go("sent");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const shown = useCallback(
    (next: Phase) => () => {
      setPhase(next);
    },
    [],
  );

  const step = STEP_OF[phase];
  const link = created && typeof window !== "undefined" ? `${window.location.origin}/taklif/${created.invite_token}` : "";

  return (
    <div>
      {phase !== "sent" && (
        <div className="mb-8">
          <Stepper step={step} />
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase === "classifying" || phase === "comparing" || phase === "inviting" ? `${phase}` : phase}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {phase === "describe" && <DescribeStep text={text} setText={setText} region={region} setRegion={setRegion} onNext={classify} />}

          {phase === "classifying" && (
            <>
              <StepHeading eyebrow="2-qadam" title="AI nizoni oʻqiyapti" />
              <AiThinking
                steps={["Matn oʻqilmoqda", "Nizo turi aniqlanmoqda", "Summa va tomonlar ajratilmoqda", "Qonun bilan solishtirilmoqda"]}
                done={ready}
                minMs={2000}
                onShown={shown("classified")}
              />
            </>
          )}
          {phase === "classified" && classification && (
            <ClassifyStep
              data={classification}
              setType={(t) => setClassification({ ...classification, dispute_type: t })}
              onNext={compare}
              onBack={() => go("describe")}
            />
          )}

          {phase === "comparing" && (
            <>
              <StepHeading eyebrow="3-qadam" title="Sud bilan taqqoslanmoqda" />
              <AiThinking
                steps={["Davlat boji hisoblanmoqda", "Sud muddatlari koʻrilmoqda", "Mediatsiya xarajati baholanmoqda"]}
                done={ready}
                minMs={1800}
                onShown={shown("compared")}
              />
            </>
          )}
          {phase === "compared" && comparison && <CompareStep data={comparison} onNext={() => go("respondent")} onBack={() => go("classified")} />}

          {phase === "respondent" && (
            <RespondentStep name={rName} setName={setRName} phone={rPhone} setPhone={setRPhone} onNext={writeInvite} onBack={() => go("compared")} />
          )}

          {phase === "inviting" && (
            <>
              <StepHeading eyebrow="5-qadam" title="AI taklif yozmoqda" />
              <AiThinking
                steps={["Ohang betaraf qilinmoqda", "Ikkala tomon uchun foyda tushuntirilmoqda", "Keyingi qadam aniqlanmoqda"]}
                done={ready}
                minMs={1800}
                onShown={shown("invite")}
              />
            </>
          )}
          {phase === "invite" && invite && (
            <InviteStep
              text={inviteText}
              setText={setInviteText}
              checks={invite.checks}
              source={invite.source}
              busy={busy}
              onSend={send}
              onBack={() => go("respondent")}
            />
          )}

          {phase === "sent" && created && <SentStep item={created} link={link} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
