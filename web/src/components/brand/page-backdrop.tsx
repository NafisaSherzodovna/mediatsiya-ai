"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";
import { GirihPattern } from "./backdrop";

/**
 * Page background variants, picked by the team. Preview any of them with `?fon=a|b|c|d`;
 * the choice sticks in localStorage. `DEFAULT` is what everyone sees.
 */
export type Fon = "a" | "b" | "c" | "d";
const DEFAULT: Fon = "a";
const KEY = "ma.fon";
const noop = () => () => {};

function useFon(): Fon {
  const params = useSearchParams();
  const q = params.get("fon");
  const stored = useSyncExternalStore(
    noop,
    () => {
      try {
        return window.localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  if (q && "abcd".includes(q)) {
    try {
      window.localStorage.setItem(KEY, q);
    } catch {
      /* ignore */
    }
    return q as Fon;
  }
  return stored && "abcd".includes(stored) ? (stored as Fon) : DEFAULT;
}

/** Soft colour field shared by all variants: teal, stamp blue and a warm apricot. */
function Glows({ strong = false }: { strong?: boolean }) {
  const k = strong ? 1 : 0.75;
  return (
    <>
      <div className="absolute -top-48 -left-40 size-[760px] rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side, rgb(13 148 136 / ${0.22 * k}), transparent)` }} />
      <div className="absolute -top-32 right-[-12%] size-[680px] rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side, rgb(46 79 163 / ${0.2 * k}), transparent)` }} />
      <div className="absolute top-[38%] left-[42%] size-[620px] rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side, rgb(245 166 120 / ${0.18 * k}), transparent)` }} />
      <div className="absolute bottom-[-20%] left-[-10%] size-[640px] rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side, rgb(255 214 120 / ${0.16 * k}), transparent)` }} />
    </>
  );
}

function Layer() {
  const fon = useFon();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" data-fon={fon}>
      {/* a: clean paper with two soft glows */}
      {fon === "a" && <Glows strong />}
      {/* b: fine dot grid fading downward */}
      {fon === "b" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgb(13 148 136 / 0.32) 1.1px, transparent 1.4px)",
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(to bottom, black, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 75%)",
            }}
          />
          <Glows />
        </>
      )}
      {/* c: a few wide arcs rising from the bottom — the bridge, very quiet */}
      {fon === "c" && <Glows />}
      {fon === "c" && (
        <svg className="absolute inset-x-0 bottom-0 h-[70vh] w-full" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice">
          {[260, 420, 580, 740, 900].map((r, i) => (
            <circle key={r} cx={720} cy={900} r={r} fill="none" stroke={i % 2 ? "var(--seal)" : "#0d9488"} strokeOpacity={0.22} strokeWidth={1.6} />
          ))}
        </svg>
      )}
      {/* d: Uzbek girih lattice, very faint, fading downward */}
      {fon === "d" && <Glows />}
      {fon === "d" && (
        <div
          className="absolute inset-0"
          style={{ maskImage: "linear-gradient(to bottom, black, transparent 80%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)" }}
        >
          <GirihPattern tone="teal" id="girih-page" className="h-full w-full" />
        </div>
      )}
    </div>
  );
}

export function PageBackdrop() {
  return (
    <Suspense>
      <Layer />
    </Suspense>
  );
}
