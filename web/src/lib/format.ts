const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

/** Groups digits with narrow no-break spaces: 9000000 -> "9 000 000". */
export function groupDigits(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function som(n: number): string {
  return `${groupDigits(n)} soʻm`;
}

/** Short money form for tight spaces: 9 000 000 -> "9 mln". */
export function somShort(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",")} mln`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} ming`;
  return `${n}`;
}

export function days(min: number, max: number): string {
  return min === max ? `${min} kun` : `${min}–${max} kun`;
}

function parts(iso: string) {
  const d = new Date(iso);
  // Show Tashkent time (UTC+5) regardless of the viewer's zone.
  const t = new Date(d.getTime() + 5 * 3600_000);
  return { day: t.getUTCDate(), month: t.getUTCMonth(), year: t.getUTCFullYear(), h: t.getUTCHours(), m: t.getUTCMinutes() };
}

export function dateUz(iso: string, withTime = true): string {
  const p = parts(iso);
  const base = `${p.day}-${MONTHS[p.month]}`;
  return withTime ? `${base}, ${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}` : base;
}

export function monthUz(yyyyMm: string): string {
  const m = Number(yyyyMm.slice(5, 7));
  return MONTHS[m - 1]?.slice(0, 3) ?? yyyyMm;
}

export function percent(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits).replace(".", ",")} %`;
}
