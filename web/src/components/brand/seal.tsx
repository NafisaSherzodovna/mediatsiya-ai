"use client";

import { motion } from "motion/react";
import { cn } from "cn";

/** Round seal (muhr). `stamped` plays the press-in: scale 1.6 -> 1, slight turn, ring ripple. */
export function Seal({
  stamped = true,
  label = "KELISHILDI",
  sub = "MEDIATSIYA",
  className,
  delay = 0,
}: {
  stamped?: boolean;
  label?: string;
  sub?: string;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn("relative size-28", className)} aria-label={`Muhr: ${label}`} role="img">
      {stamped && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-seal"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ delay: delay + 0.32, duration: 0.7, ease: "easeOut" }}
        />
      )}
      <motion.svg
        viewBox="0 0 120 120"
        className="size-full"
        initial={stamped ? { scale: 1.6, rotate: -14, opacity: 0 } : false}
        animate={stamped ? { scale: 1, rotate: -6, opacity: 0.92 } : { rotate: -6, opacity: 0.92 }}
        transition={{ delay, type: "spring", stiffness: 420, damping: 18 }}
      >
        <defs>
          <path id="seal-top" d="M 20 60 A 40 40 0 0 1 100 60" />
          <path id="seal-bottom" d="M 22 62 A 38 38 0 0 0 98 62" />
        </defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke="var(--seal)" strokeWidth="3.5" />
        <circle cx="60" cy="60" r="49" fill="none" stroke="var(--seal)" strokeWidth="1.2" />
        <circle cx="60" cy="60" r="27" fill="none" stroke="var(--seal)" strokeWidth="1.2" strokeDasharray="2 3" />
        <text fontSize="11" fontWeight="700" letterSpacing="2.4" fill="var(--seal)" fontFamily="var(--font-onest)">
          <textPath href="#seal-top" startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
        <text fontSize="9" fontWeight="600" letterSpacing="2.2" fill="var(--seal)" fontFamily="var(--font-onest)">
          <textPath href="#seal-bottom" startOffset="50%" textAnchor="middle">
            {sub}
          </textPath>
        </text>
        <path d="M44 62c4.6-8 10-12 16-12s11.4 4 16 12" fill="none" stroke="var(--seal)" strokeWidth="3" strokeLinecap="round" />
        <path d="M42 68h36" stroke="var(--seal)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="60" cy="49" r="3" fill="var(--seal)" />
      </motion.svg>
    </div>
  );
}
