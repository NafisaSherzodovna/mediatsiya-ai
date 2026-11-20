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

function Layer() {
  const fon = useFon();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" data-fon={fon}>
      {/* a: clean paper with two soft glows */}
      {fon === "a" && (
        <>
          <div className="absolute -top-40 -left-40 size-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(15_118_110/0.10),transparent)]" />
          <div className="absolute -top-24 right-[-10%] size-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(46_79_163/0.08),transparent)]" />
        </>
      )}
      {/* b: fine dot grid fading downward */}
      {fon === "b" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgb(27 42 74 / 0.10) 1px, transparent 1.2px)",
              backgroundSize: "22px 22px",
              maskImage: "linear-gradient(to bottom, black, transparent 75%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 75%)",
            }}
          />
          <div className="absolute -top-40 left-1/2 size-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(15_118_110/0.08),transparent)]" />
        </>
      )}
      {/* c: a few wide arcs rising from the bottom — the bridge, very quiet */}
      {fon === "c" && (
        <svg className="absolute inset-x-0 bottom-0 h-[70vh] w-full" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice">
          {[260, 420, 580, 740, 900].map((r, i) => (
            <circle key={r} cx={720} cy={900} r={r} fill="none" stroke={i % 2 ? "var(--seal)" : "var(--accord)"} strokeOpacity={0.09} strokeWidth={1.2} />
          ))}
        </svg>
      )}
      {/* d: Uzbek girih lattice, very faint, fading downward */}
      {fon === "d" && (
        <div
          className="absolute inset-0"
          style={{ maskImage: "linear-gradient(to bottom, black, transparent 80%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 80%)" }}
        >
          <GirihPattern tone="dark" id="girih-page" className="h-full w-full" />
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
