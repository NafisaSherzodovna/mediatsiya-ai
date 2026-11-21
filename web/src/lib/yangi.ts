// Classic Uzbek Latin -> the new (improved) alphabet: gʻ→ğ, oʻ→ö, sh→ş, ch→ç.
// Pure and server-safe: used by the DOM bridge, page metadata and text that leaves the site (Telegram, clipboard).

// U+011E/011F, U+00D6/00F6, U+015E/015F (cedilla, not the comma-below Ș), U+00C7/00E7
const APOS = "ʻ‘'`’"; // ʼ (U+02BC) is the tutuq belgisi and stays as it is
const OG = new RegExp(`([GgOo])[${APOS}]`, "g");
const OG_MAP: Record<string, string> = { G: "Ğ", g: "ğ", O: "Ö", o: "ö" };
const SH_CH = /([SsCc])([Hh])/g;
// Foreign words and tokens that must keep their spelling
const KEEP = /^(?:\S*@\S*|\S*:\/\/\S*|\S+\.(?:uz|com|org|ru|io|demo)\S*|Techstars|Chrome)$/;

function word(w: string): string {
  if (KEEP.test(w)) return w;
  return w
    .replace(OG, (_, l: string) => OG_MAP[l])
    .replace(SH_CH, (_, a: string, h: string) => {
      const upper = a === a.toUpperCase();
      // "SH"/"Sh" → Ş, "sh" → ş; "sH" is not a digraph
      if (!upper && h === "H") return a + h;
      const base = a.toLowerCase() === "s" ? "ş" : "ç";
      return upper ? base.toUpperCase() : base;
    });
}

export function toYangi(text: string): string {
  if (!/[GgOoSsCc]/.test(text)) return text;
  return text.split(/(\s+)/).map((t) => (/\s/.test(t) ? t : word(t))).join("");
}
