/**
 * Calm, fine-line backgrounds for the "Muhr va koʻprik" world (see /DESIGN.md, "Backgrounds").
 * - Guilloche: the engraved line work of certificates and official documents (trust, "a real document").
 * - Girih: the Uzbek 8-point star lattice ("dilduz"), for local identity on dark sections.
 * All generated as SVG in code: no images, sharp at any size, cheap to render.
 */
import { cn } from "cn";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

/** One closed ring whose radius is modulated by a sine: r(θ) = R + A·sin(kθ). */
function ringPath(R: number, A: number, k: number, steps = 220): string {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = R + A * Math.sin(k * t);
    d += `${i ? "L" : "M"}${round(r * Math.cos(t))} ${round(r * Math.sin(t))}`;
  }
  return d + "Z";
}

const ROSETTE_LAYERS = [
  { R: 300, A: 26, k: 7, copies: 30, color: "var(--accord)", opacity: 0.32 },
  { R: 220, A: 18, k: 9, copies: 24, color: "var(--seal)", opacity: 0.26 },
  { R: 140, A: 12, k: 6, copies: 18, color: "var(--accord)", opacity: 0.3 },
].map((l) => ({ ...l, d: ringPath(l.R, l.A, l.k) }));

/** Guilloche rosette: rotated copies of sine-modulated rings, like the centre of a certificate. */
export function GuillocheRosette({ className, spin = true }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="-340 -340 680 680" className={cn("pointer-events-none select-none", className)} aria-hidden>
      <g className={spin ? "origin-center animate-[spin_240s_linear_infinite] motion-reduce:animate-none" : undefined}>
        {ROSETTE_LAYERS.map((l) =>
          Array.from({ length: l.copies }, (_, i) => (
            <path
              key={`${l.R}-${i}`}
              d={l.d}
              fill="none"
              stroke={l.color}
              strokeOpacity={l.opacity}
              strokeWidth={0.7}
              transform={`rotate(${(360 / l.copies / l.k) * i})`}
              vectorEffect="non-scaling-stroke"
            />
          )),
        )}
        <circle r={318} fill="none" stroke="var(--accord)" strokeOpacity={0.25} strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        <circle r={330} fill="none" stroke="var(--accord)" strokeOpacity={0.18} strokeWidth={0.8} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

function wavePath(i: number, width: number): string {
  let d = "";
  for (let x = 0; x <= width; x += 10) {
    const y = 40 + i * 7 + 16 * Math.sin(x / 150 + i * 0.32) + 7 * Math.sin(x / 47 + i * 0.9);
    d += `${x ? "L" : "M"}${x} ${round(y)}`;
  }
  return d;
}

const WAVES = Array.from({ length: 16 }, (_, i) => wavePath(i, 1600));

/** Engraved wave band (top of every page), fading downward. */
export function GuillocheWaves({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1600 200"
      preserveAspectRatio="xMidYMin slice"
      className={cn("pointer-events-none select-none", className)}
      style={{ maskImage: "linear-gradient(to bottom, black 20%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent)" }}
      aria-hidden
    >
      {WAVES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={i % 3 === 0 ? "var(--seal)" : "var(--accord)"} strokeOpacity={0.13} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/**
 * Girih lattice: an 8-point star (two squares at 45°) per tile, joined to its neighbours,
 * the classic Central Asian "dilduz" grid. `tone` sets the line colour.
 */
export function GirihPattern({ className, tone = "light", id = "girih" }: { className?: string; tone?: "light" | "dark"; id?: string }) {
  const s = 72; // tile
  const c = s / 2;
  const r = 15; // star radius
  const pts = (rot: number) =>
    Array.from({ length: 4 }, (_, i) => {
      const a = ((i * 90 + rot) * Math.PI) / 180;
      return `${round(c + r * Math.cos(a))},${round(c + r * Math.sin(a))}`;
    }).join(" ");
  const stroke = tone === "light" ? "rgb(255 255 255 / 0.09)" : "rgb(27 42 74 / 0.07)";
  return (
    <svg className={cn("pointer-events-none select-none", className)} aria-hidden>
      <defs>
        <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={stroke} strokeWidth={1}>
            <polygon points={pts(0)} />
            <polygon points={pts(45)} />
            <circle cx={c} cy={c} r={5} />
            {/* arms to the tile edges join neighbouring stars into a lattice */}
            <path d={`M${c} 0V${c - r}M${c} ${s}V${c + r}M0 ${c}H${c - r}M${s} ${c}H${c + r}`} />
            <path d={`M0 0L${c - r * 0.71} ${c - r * 0.71}M${s} 0L${c + r * 0.71} ${c - r * 0.71}M0 ${s}L${c - r * 0.71} ${c + r * 0.71}M${s} ${s}L${c + r * 0.71} ${c + r * 0.71}`} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
