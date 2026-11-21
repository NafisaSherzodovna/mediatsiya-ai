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

/** "2020-04-08" → "08.04.2020", the format the Ministry's mediator registry uses. */
export function dmy(ymd: string): string {
  return ymd.slice(0, 10).split("-").reverse().join(".");
}

export function monthUz(yyyyMm: string): string {
  const m = Number(yyyyMm.slice(5, 7));
  const name = MONTHS[m - 1];
  if (!name) return yyyyMm;
  return name.startsWith("iyu") ? name : name.slice(0, 3); // iyun / iyul stay distinct
}

/** Wall-clock parts in Tashkent (UTC+5, no DST), whatever the viewer's own time zone is. */
export function tashkent(iso: string) {
  const t = new Date(new Date(iso).getTime() + 5 * 3600_000);
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth(), d: t.getUTCDate(), wd: t.getUTCDay(), h: t.getUTCHours(), mi: t.getUTCMinutes() };
}

export function hhmmTashkent(iso: string): string {
  const p = tashkent(iso);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" of a Tashkent calendar day, `offset` days from today. */
export function tashkentDay(offset: number): { ymd: string; wd: number; d: number; mo: number } {
  const p = tashkent(new Date(Date.now() + offset * 864e5).toISOString());
  return { ymd: `${p.y}-${String(p.mo + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`, wd: p.wd, d: p.d, mo: p.mo };
}

export function percent(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits).replace(".", ",")} %`;
}
