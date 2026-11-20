/**
 * "Atlas muvozanati" — Uzbek khan-atlas (abr ikat) bands in Samarkand tile colours, mirrored left and right
 * like the two pans of a balance: two equal sides, a clear middle for the content.
 *
 * Craft notes:
 * - motifs are concentric stepped lozenges (outer colour → cream gap → inner colour → light core), the classic
 *   atlas "diamond" read at a distance;
 * - the abr "cloud" edge is an SVG turbulence + displacement filter that feathers along the warp (vertical);
 * - fine warp threads and a soft silk sheen sit on top, and a multi-stripe selvedge runs along the page edge.
 * No image files: everything is generated here.
 */
import { cn } from "cn";

const C = {
  cobalt: "#1d4fa8",
  turquoise: "#12a5a1",
  saffron: "#f0b43c",
  pomegranate: "#d24a3a",
  magenta: "#b0367a",
  cream: "#fff6e4",
};

// Each motif: [outer, inner, core]
const SCHEMES: [string, string, string][] = [
  [C.cobalt, C.saffron, C.pomegranate],
  [C.turquoise, C.magenta, C.saffron],
  [C.pomegranate, C.turquoise, C.cream],
  [C.saffron, C.cobalt, C.turquoise],
  [C.magenta, C.saffron, C.cobalt],
  [C.turquoise, C.pomegranate, C.saffron],
];

const W = 240;
const ROW = 132;
const N = 9;
const HEIGHT = ROW * N;
const CX = W * 0.56;

function r1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Stepped lozenge (staircase edges, like warp-dyed atlas). */
function lozenge(cx: number, cy: number, w: number, h: number, steps: number): string {
  const pts: string[] = [];
  const sx = w / 2 / steps;
  const sy = h / 2 / steps;
  // top → right → bottom → left, each edge as a staircase
  for (let i = 0; i < steps; i++) pts.push(`${r1(cx + i * sx)},${r1(cy - h / 2 + i * sy)}`, `${r1(cx + (i + 1) * sx)},${r1(cy - h / 2 + i * sy)}`);
  for (let i = 0; i < steps; i++) pts.push(`${r1(cx + w / 2 - i * sx)},${r1(cy + i * sy)}`, `${r1(cx + w / 2 - i * sx)},${r1(cy + (i + 1) * sy)}`);
  for (let i = 0; i < steps; i++) pts.push(`${r1(cx - i * sx)},${r1(cy + h / 2 - i * sy)}`, `${r1(cx - (i + 1) * sx)},${r1(cy + h / 2 - i * sy)}`);
  for (let i = 0; i < steps; i++) pts.push(`${r1(cx - w / 2 + i * sx)},${r1(cy - i * sy)}`, `${r1(cx - w / 2 + i * sx)},${r1(cy - (i + 1) * sy)}`);
  return pts.join(" ");
}

const MOTIFS = Array.from({ length: N }, (_, i) => {
  const cy = ROW / 2 + i * ROW;
  const [outer, inner, core] = SCHEMES[i % SCHEMES.length];
  const big = i % 2 === 0;
  const s = big ? 1 : 0.86;
  return {
    i,
    layers: [
      { d: lozenge(CX, cy, W * 0.84 * s, ROW * 0.96 * s, 9), fill: outer },
      { d: lozenge(CX, cy, W * 0.62 * s, ROW * 0.7 * s, 7), fill: C.cream },
      { d: lozenge(CX, cy, W * 0.5 * s, ROW * 0.56 * s, 6), fill: inner },
      { d: lozenge(CX, cy, W * 0.26 * s, ROW * 0.3 * s, 4), fill: core },
      { d: lozenge(CX, cy, W * 0.08, ROW * 0.1, 2), fill: C.cream },
    ],
    // small "comb" ticks between motifs (taroq)
    tick: { y: cy + ROW / 2, fill: SCHEMES[(i + 2) % SCHEMES.length][0] },
  };
});

const SELVEDGE = [
  { x: 0, w: 18, fill: C.cobalt },
  { x: 18, w: 4, fill: C.saffron },
  { x: 22, w: 3, fill: C.cream },
  { x: 25, w: 6, fill: C.pomegranate },
  { x: 31, w: 3, fill: C.turquoise },
];

export function AtlasBand({ className, side = "left", id = "atlas" }: { className?: string; side?: "left" | "right"; id?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${HEIGHT}`}
      preserveAspectRatio="xMinYMin slice"
      className={cn("pointer-events-none select-none", side === "right" && "-scale-x-100", className)}
      aria-hidden
    >
      <defs>
        <filter id={`${id}-abr`} x="-8%" y="-2%" width="116%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.75" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="0.35 0.9" />
        </filter>
        <pattern id={`${id}-warp`} width="3" height="8" patternUnits="userSpaceOnUse">
          <rect width="1" height="8" fill="#fff" opacity="0.16" />
        </pattern>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width={W} height={HEIGHT} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        <g filter={`url(#${id}-abr)`}>
          {/* silk ground */}
          <rect x={34} width={W - 34} height={HEIGHT} fill={C.cream} opacity={0.55} />
          {MOTIFS.map((m) => (
            <g key={m.i}>
              {m.layers.map((l, k) => (
                <polygon key={k} points={l.d} fill={l.fill} />
              ))}
              <rect x={CX - 3} y={m.tick.y - 9} width={6} height={18} fill={m.tick.fill} />
            </g>
          ))}
          {SELVEDGE.map((s) => (
            <rect key={s.x} x={s.x} width={s.w} height={HEIGHT} fill={s.fill} />
          ))}
        </g>
        <rect width={W} height={HEIGHT} fill={`url(#${id}-warp)`} />
        <rect width={W} height={HEIGHT} fill={`url(#${id}-sheen)`} />
      </g>
    </svg>
  );
}

/** Thin multi-colour atlas line, used under headers as an accent. */
export function AtlasRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-[3px] w-full", className)}
      style={{
        background: `repeating-linear-gradient(90deg, ${C.cobalt} 0 28px, ${C.saffron} 28px 34px, ${C.turquoise} 34px 62px, ${C.pomegranate} 62px 70px, ${C.magenta} 70px 92px, ${C.saffron} 92px 98px)`,
        filter: "blur(0.3px)",
      }}
    />
  );
}
