"use client";

import { Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/brand/bits";
import { Seal } from "@/components/brand/seal";

const STEPS = 5; // 0 empty, 1 left, 2 right, 3 ai, 4 bridge + agreement
const STEP_MS = [500, 1300, 1400, 1500, 4800];

/** Signature hero: two sides meet over a bridge; the AI finds common ground; the seal lands. */
export function HeroBridge() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? 4 : 0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      if (step >= STEPS - 1) {
        setCycle((c) => c + 1);
        setStep(0);
      } else setStep((s) => s + 1);
    }, STEP_MS[step]);
    return () => clearTimeout(t);
  }, [step, reduce]);

  return (
    <div className="relative mx-auto w-full max-w-[520px] select-none" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,rgb(15_118_110/0.10),transparent)]" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <Party show={step >= 1} side="left" name="Aziz Karimov" role="Uy egasi" text="Ijarachim 3 oydan beri toʻlamayapti." k={`l${cycle}`} />
        <Party show={step >= 2} side="right" name="Bekzod Umarov" role="Ijarachi" text="Ishsiz qoldim, boʻlib toʻlay olaman." k={`r${cycle}`} />
      </div>

      <svg viewBox="0 0 520 110" className="mt-1 h-[86px] w-full overflow-visible sm:h-[110px]">
        <path d="M110 6 C 150 90, 370 90, 410 6" fill="none" stroke="var(--rule)" strokeWidth="2" strokeDasharray="4 6" />
        <motion.path
          key={`b${cycle}`}
          d="M110 6 C 150 90, 370 90, 410 6"
          fill="none"
          stroke="var(--accord)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: step >= 4 ? 1 : 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <AnimatePresence>
          {step >= 3 && (
            <motion.g key={`ai${cycle}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <rect x="170" y="52" width="180" height="34" rx="17" fill="white" stroke="var(--accord)" strokeWidth="1.5" />
              <text x="260" y="74" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--accord-strong)" fontFamily="var(--font-onest)">
                AI: umumiy nuqta topildi
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      <AnimatePresence mode="wait">
        {step >= 4 && (
          <motion.div
            key={`a${cycle}`}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hujjat relative mx-auto -mt-2 max-w-[400px] p-5 pl-14 font-doc"
          >
            <p className="flex items-center gap-1.5 font-sans text-xs font-semibold tracking-[0.12em] text-accord uppercase">
              <Sparkles className="size-3.5" /> Mediativ kelishuv
            </p>
            <p className="mt-2 text-[1.05rem] leading-snug text-ink">
              Qarz <span className="marker">6 oyda, oyiga 1,5 mln soʻmdan</span> toʻlanadi. Ijara davom etadi.
            </p>
            <p className="mt-2 font-sans text-xs text-ink-soft">Mediator: Dilnoza Rahimova · 9 kun ichida</p>
            <Seal className="absolute -top-8 -right-1 size-20 sm:-top-7 sm:-right-8 sm:size-24" delay={0.55} />
          </motion.div>
        )}
      </AnimatePresence>
      {step < 4 && <div className="h-[132px]" />}
    </div>
  );
}

function Party({ show, side, name, role, text, k }: { show: boolean; side: "left" | "right"; name: string; role: string; text: string; k: string }) {
  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div
          key={k}
          initial={{ opacity: 0, x: side === "left" ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="sheet p-3.5 sm:p-4"
        >
          <div className="flex items-center gap-2.5">
            <Avatar name={name} className="size-9 text-xs" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="text-xs text-ink-soft">{role}</p>
            </div>
          </div>
          <p className={`mt-3 rounded-xl px-3 py-2 text-[0.85rem] leading-snug text-ink sm:text-sm ${side === "left" ? "rounded-tl-sm bg-ink-wash" : "rounded-tr-sm bg-accord-tint"}`}>
            {text}
          </p>
        </motion.div>
      ) : (
        <div key={`${k}-ph`} className="h-[124px] rounded-2xl border border-dashed border-rule sm:h-[132px]" />
      )}
    </AnimatePresence>
  );
}
