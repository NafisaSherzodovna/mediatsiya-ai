/**
 * "Atlas muvozanati" — Uzbek khan-atlas (abr ikat) bands in Samarkand tile colours, mirrored left and right
 * like the two pans of a balance: two equal sides, a clear middle for the content. The abr "cloud" blur of the
 * ikat edges comes from an SVG displacement filter (warp-direction feathering), so no image files are used.
 */
import { cn } from "cn";

// Samarkand tile + atlas palette: cobalt, turquoise, saffron gold, pomegranate, plus white gaps.
const PALETTE = ["#1f4e9e", "#14a3a0", "#e9b543", "#cf4f3c", "#1f4e9e", "#e9b543", "#14a3a0", "#cf4f3c"];
const W = 240; // band width in SVG units
const ROW = 120; // motif height

function r1(n: number) {
  return Math.round(n * 10) / 10;
}

/** One ikat motif: a stepped lozenge ("arrow-diamond") with a smaller inner lozenge. */
function lozenge(cx: number, cy: number, w: number, h: number, steps = 6): string {
  // stepped edges imitate the warp-dyed staircase look of atlas motifs
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = cy - h / 2 + (h / 2) * (i / steps);
    const x = cx + (w / 2) * (i / steps);
    pts.push(`${r1(x)},${r1(y)}`, `${r1(x)},${r1(y + h / 2 / steps)}`);
  }
  for (let i = steps; i >= 0; i--) {
    const y = cy + h / 2 - (h / 2) * (i / steps);
    const x = cx + (w / 2) * (i / steps);
    pts.push(`${r1(x)},${r1(y)}`, `${r1(x - 0.01)},${r1(y + h / 2 / steps)}`);
  }
  for (let i = 0; i <= steps; i++) {
    const y = cy + h / 2 - (h / 2) * (i / steps);
    const x = cx - (w / 2) * (i / steps);
    pts.push(`${r1(x)},${r1(y)}`, `${r1(x)},${r1(y - h / 2 / steps)}`);
  }
  for (let i = steps; i >= 0; i--) {
    const y = cy - h / 2 + (h / 2) * (i / steps);
    const x = cx - (w / 2) * (i / steps);
    pts.push(`${r1(x)},${r1(y)}`);
  }
  return pts.join(" ");
}

const MOTIFS = Array.from({ length: 10 }, (_, i) => {
  const cy = ROW / 2 + i * ROW;
  return {
    i,
    cy,
    outer: lozenge(W * 0.55, cy, W * 0.78, ROW * 0.92),
    inner: lozenge(W * 0.55, cy, W * 0.36, ROW * 0.46, 4),
    color: PALETTE[i % PALETTE.length],
    inside: PALETTE[(i + 3) % PALETTE.length],
  };
});
const HEIGHT = ROW * MOTIFS.length;

export function AtlasBand({ className, side = "left", id = "atlas" }: { className?: string; side?: "left" | "right"; id?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${HEIGHT}`}
      preserveAspectRatio="xMinYMin slice"
      className={cn("pointer-events-none select-none", side === "right" && "-scale-x-100", className)}
      aria-hidden
    >
      <defs>
        {/* abr: feather the edges along the warp (vertical threads) */}
        <filter id={`${id}-abr`} x="-10%" y="-2%" width="120%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="0.6 1.4" />
        </filter>
        <linearGradient id={`${id}-fade`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width={W} height={HEIGHT} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`} filter={`url(#${id}-abr)`}>
        {/* warp stripes behind the motifs */}
        <rect x={0} y={0} width={W * 0.16} height={HEIGHT} fill="#1f4e9e" opacity={0.9} />
        <rect x={W * 0.16} y={0} width={W * 0.05} height={HEIGHT} fill="#e9b543" opacity={0.9} />
        {MOTIFS.map((m) => (
          <g key={m.i}>
            <polygon points={m.outer} fill={m.color} opacity={0.85} />
            <polygon points={m.inner} fill={m.inside} opacity={0.95} />
            <polygon points={lozenge(W * 0.55, m.cy, W * 0.12, ROW * 0.16, 2)} fill="#fffaf0" />
          </g>
        ))}
      </g>
    </svg>
  );
}
