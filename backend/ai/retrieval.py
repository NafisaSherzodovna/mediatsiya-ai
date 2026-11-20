"""BM25 retrieval over the Law "On Mediation" (corpus/mediatsiya-qonuni.md, one "## N-modda. Title" per article)."""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from rank_bm25 import BM25Okapi

from .text import normalize

CORPUS = Path(__file__).parent / "corpus" / "mediatsiya-qonuni.md"
URL = "https://lex.uz/docs/-3805227"
_TOKEN = re.compile(r"[a-zʻʼ]{3,}")  # noqa: RUF001
# very common words that carry no meaning for retrieval
_STOP = {"va", "bilan", "uchun", "yoki", "boʻyicha", "mediatsiya", "mediatsiyani", "mediatsiyaning", "qonun", "ushbu", "boʻlsa",
         "taqdirda", "tomonidan", "nima", "qanday", "qachon", "kim", "agar", "hamda", "shuningdek", "qilish", "etish"}


# question words -> words the law uses
_ALIAS = {
    "haq": "haq toʻlash", "haqi": "haq toʻlash", "pul": "haq toʻlash", "bepul": "tekin haq", "narx": "haq toʻlash", "narxi": "haq toʻlash",
    "jinoyat": "amal qilish sohasi", "jinoiy": "amal qilish sohasi", "kim": "talablar shaxs", "muddat": "muddati", "muddatda": "muddati",
    "bajarilmasa": "ijro majburiy", "bajarmasa": "ijro majburiy", "maxfiy": "maxfiylik", "reyestr": "reyestri",
}


def _tokens(s: str) -> list[str]:
    out = []
    words = _TOKEN.findall(normalize(s))
    for w in list(words):
        words += _TOKEN.findall(_ALIAS.get(w, ""))
    for t in words:
        if t in _STOP or t.startswith("mediat"):
            continue  # "mediatsiya/mediator" appears in every article
        out.append(t[:5])  # crude stem: Uzbek is agglutinative, so the first letters match most word forms
    return out


@lru_cache(maxsize=1)
def _index():
    text = CORPUS.read_text(encoding="utf-8")
    docs = []
    for block in re.split(r"(?m)^## ", text)[1:]:
        head, _, body = block.partition("\n\n")
        m = re.match(r"(\S+-modda)\.\s*(.*)", head.strip())
        if not m:
            continue
        docs.append({"article": m.group(1), "title": m.group(2).strip(), "text": body.strip(), "url": URL})
    bm25 = BM25Okapi([_tokens(d["title"] + " " + d["title"] + " " + d["text"]) for d in docs])
    return docs, bm25


def top_k(question: str, k: int = 3) -> list[dict]:
    docs, bm25 = _index()
    q = _tokens(question)
    if not q:
        return []
    scores = bm25.get_scores(q)
    ranked = sorted(range(len(docs)), key=lambda i: scores[i], reverse=True)
    return [docs[i] for i in ranked[:k] if scores[i] > 0]
