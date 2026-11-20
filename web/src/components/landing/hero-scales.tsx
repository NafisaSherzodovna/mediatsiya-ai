"use client";

import { HandCoins, Sparkles, Target } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Seal } from "@/components/brand/seal";

/**
 * Signature hero: the scales of justice. Each party sits on a pan. The dispute tips the beam;
 * the AI finds common ground at the fulcrum; the beam levels out and the agreement is sealed.
 */
const PIVOT_X = 260;
const PIVOT_Y = 64;
const ARM = 190; // pivot → pan string
const STEP_MS = [1600, 1700, 1500, 5200]; // tipped, ai thinking, balancing, sealed

export function HeroScales() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? 3 : 0);
  const [cycle, setCycle] = useState(0);
  const angle = useSpring(reduce ? 0 : 9, { stiffness: 55, damping: 9, mass: 1.1 });
  const leftY = useTransform(angle, (a) => -ARM * Math.sin((a * Math.PI) / 180));
  const rightY = useTransform(angle, (a) => ARM * Math.sin((a * Math.PI) / 180));
  const leftX = useTransform(angle, (a) => -ARM * (1 - Math.cos((a * Math.PI) / 180)));
  const rightX = useTransform(angle, (a) => ARM * (1 - Math.cos((a * Math.PI) / 180)));
  // beam end points follow the angle (SVG attributes bound to motion values)
  const lx = useTransform(angle, (a) => PIVOT_X - ARM * Math.cos((a * Math.PI) / 180));
  const ly = useTransform(angle, (a) => PIVOT_Y - ARM * Math.sin((a * Math.PI) / 180));
  const rx = useTransform(angle, (a) => PIVOT_X + ARM * Math.cos((a * Math.PI) / 180));
  const ry = useTransform(angle, (a) => PIVOT_Y + ARM * Math.sin((a * Math.PI) / 180));

  useEffect(() => {
    if (reduce) return;
    angle.set(step >= 2 ? 0 : step === 1 ? 6 : 9);
    const t = setTimeout(() => {
      if (step >= STEP_MS.length - 1) {
        setCycle((c) => c + 1);
        setStep(0);
      } else setStep((s) => s + 1);
    }, STEP_MS[step]);
    return () => clearTimeout(t);
  }, [step, reduce, angle]);

  const balanced = step >= 2;

  return (
    <div className="relative mx-auto w-full max-w-[520px] select-none" aria-hidden>
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgb(15_118_110/0.12),transparent)]" />
      <div className="relative mx-[7%] h-[300px] sm:mx-0 sm:h-[350px]">
        <svg viewBox="0 0 520 350" className="absolute inset-0 h-full w-full overflow-visible">
          {/* base and post */}
          <path d="M200 334h120" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
          <path d="M228 334c8-14 20-20 32-20s24 6 32 20" fill="var(--ink-wash)" stroke="var(--ink)" strokeWidth="2" />
          <path d={`M${PIVOT_X} ${PIVOT_Y}V316`} stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
          {/* beam with its strings */}
          <motion.line x1={lx} y1={ly} x2={rx} y2={ry} stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
          <motion.circle cx={lx} cy={ly} r="6" fill="var(--ink)" />
          <motion.circle cx={rx} cy={ry} r="6" fill="var(--ink)" />
          {/* strings hang straight down from the beam ends */}
          <motion.line x1={PIVOT_X - ARM} x2={PIVOT_X - ARM} y1={PIVOT_Y} y2={PIVOT_Y + 70} style={{ x: leftX, y: leftY }} stroke="var(--ink-soft)" strokeWidth="1.5" strokeDasharray="3 4" />
          <motion.line x1={PIVOT_X + ARM} x2={PIVOT_X + ARM} y1={PIVOT_Y} y2={PIVOT_Y + 70} style={{ x: rightX, y: rightY }} stroke="var(--ink-soft)" strokeWidth="1.5" strokeDasharray="3 4" />
          {/* fulcrum: the AI */}
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="15" fill={balanced ? "var(--accord)" : "var(--ink)"} style={{ transition: "fill .5s" }} />
          <circle cx={PIVOT_X} cy={PIVOT_Y} r="22" fill="none" stroke="var(--accord)" strokeOpacity="0.35" strokeWidth="2">
            {!reduce && step === 1 && <animate attributeName="r" values="18;30;18" dur="1.2s" repeatCount="indefinite" />}
          </circle>
        </svg>

        {/* fulcrum label */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              key={`ai${cycle}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-accord/40 bg-white px-3 py-1 text-xs font-semibold whitespace-nowrap text-accord-strong shadow-sm"
            >
              <Sparkles className="size-3.5" /> AI umumiy nuqta qidirmoqda
            </motion.div>
          )}
          {balanced && (
            <motion.div
              key={`ok${cycle}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-accord px-3 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-sm"
            >
              Muvozanat topildi
            </motion.div>
          )}
        </AnimatePresence>

        {/* the two pans carry the two parties */}
        <Pan x={leftX} y={leftY} side="left" title="Talab" sub="1-tomon" text="9 mln soʻm qarz qaytarilsin" />
        <Pan x={rightX} y={rightY} side="right" title="Imkoniyat" sub="2-tomon" text="Oyiga 1,5 mln soʻm toʻlay olaman" />
      </div>

      <AnimatePresence mode="wait">
        {step === 3 && (
          <motion.div
            key={`deal${cycle}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="hujjat relative mx-auto mt-3 max-w-[400px] p-4 pl-12 font-doc"
          >
            <p className="font-sans text-[0.7rem] font-semibold tracking-[0.12em] text-accord uppercase">Mediativ kelishuv</p>
            <p className="mt-1 text-[1rem] leading-snug text-ink">
              Qarz <span className="marker">6 oyda, oyiga 1,5 mln soʻmdan</span> toʻlanadi.
            </p>
            <Seal className="absolute -top-6 -right-3 size-20 sm:-right-6" delay={0.35} />
          </motion.div>
        )}
      </AnimatePresence>
      {step !== 3 && <div className="mt-3 h-[92px]" />}
    </div>
  );
}

function Pan({
  x,
  y,
  side,
  title,
  sub,
  text,
}: {
  x: ReturnType<typeof useTransform<number, number>>;
  y: ReturnType<typeof useTransform<number, number>>;
  side: "left" | "right";
  title: string;
  sub: string;
  text: string;
}) {
  // pan centre sits under the beam end: 260 ± 190 in a 520-wide box → 13.5 % / 86.5 %
  return (
    <motion.div
      style={{ x, y, left: side === "left" ? "13.46%" : "86.54%" }}
      className="absolute top-[38%] w-[38%] max-w-[210px] -translate-x-1/2 sm:top-[37%] sm:w-[44%]"
    >
      <div className="sheet p-3">
        <div className="flex items-center gap-2">
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${side === "left" ? "bg-ink-wash text-ink" : "bg-accord-tint text-accord"}`}
          >
            {side === "left" ? <Target className="size-4" /> : <HandCoins className="size-4" />}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[0.85rem] font-semibold text-ink">{title}</p>
            <p className="text-[0.7rem] text-ink-soft">{sub}</p>
          </div>
        </div>
        <p className={`mt-2 flex min-h-[2.9rem] items-center rounded-lg px-2.5 py-1.5 text-[0.78rem] leading-snug text-ink ${side === "left" ? "bg-ink-wash" : "bg-accord-tint"}`}>{text}</p>
      </div>
      {/* the pan itself */}
      <div className="mx-auto mt-1 h-2 w-[80%] rounded-b-full bg-ink/80" />
    </motion.div>
  );
}
