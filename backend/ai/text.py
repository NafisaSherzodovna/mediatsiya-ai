"""Text helpers: Cyrillic -> Latin normalisation for rule matching, money parsing."""

import re

_CYR = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z", "и": "i",
    "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "x", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "ʼ", "ы": "i", "ь": "",
    "э": "e", "ю": "yu", "я": "ya", "ў": "oʻ", "қ": "q", "ғ": "gʻ", "ҳ": "h",
}
_APOS = re.compile(r"['‘’`ʼ]")


# The new Uzbek alphabet (ş ç ğ ö) maps back to the classic spelling the corpus and keyword rules use.
_YANGI = {"ş": "sh", "ç": "ch", "ğ": "gʻ", "ö": "oʻ"}


def normalize(s: str) -> str:
    """Lowercase, Cyrillic Uzbek/Russian -> Latin, every apostrophe variant -> ʻ (U+02BB)."""
    out = "".join(_CYR.get(ch, _YANGI.get(ch, ch)) for ch in s.lower())
    return _APOS.sub("ʻ", out)


_MLN = re.compile(r"(\d+(?:[.,]\d+)?)\s*(mln|million|milion)")
_PLAIN = re.compile(r"\d{5,}")


def amount_from(text: str) -> int | None:
    """'9 million' -> 9000000; '15 000 000 soʻm' -> 15000000; otherwise None."""
    t = normalize(text)
    m = _MLN.search(t)
    if m:
        return round(float(m.group(1).replace(",", ".")) * 1_000_000)
    compact = re.sub(r"[\s  ]", "", t)
    m = _PLAIN.search(compact)
    return int(m.group(0)) if m else None


_OG = re.compile(r"([oOgG])['‘’`ʼ]")
_TUTUQ = re.compile(r"(?<=[A-Za-z])['’`](?=[A-Za-z])")


def fix_uz(value):
    """Model output often mixes apostrophes. Make oʻ/gʻ use U+02BB and the tutuq U+02BC, recursively."""
    if isinstance(value, str):
        return _TUTUQ.sub("ʼ", _OG.sub(lambda m: m.group(1) + "ʻ", value))
    if isinstance(value, list):
        return [fix_uz(v) for v in value]
    if isinstance(value, dict):
        return {k: (v if k in ("url", "source", "dispute_type") else fix_uz(v)) for k, v in value.items()}
    return value
