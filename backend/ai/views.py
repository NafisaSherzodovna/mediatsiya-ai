"""Stateless AI endpoints (contract/api.md, "AI endpoints"). Never 5xx on a model failure."""

from __future__ import annotations

import base64
import json
import logging
import os
import subprocess
import tempfile
from functools import lru_cache
from pathlib import Path

from rest_framework.decorators import api_view, parser_classes, permission_classes, throttle_classes
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response as _Response
from rest_framework.throttling import ScopedRateThrottle

from . import client, fallbacks, prompts
from .text import fix_uz
from .schemas import Agreement, AskOut, Brief, Classification, CompareNotes, InviteOut, Position

log = logging.getLogger("ai")


def Response(data, status=200):  # noqa: N802 - drop-in for DRF Response that normalises Uzbek apostrophes
    return _Response(fix_uz(data), status=status)
DATA = Path(__file__).parent / "data"
LAW_URL = "https://lex.uz/acts/3805227"
STATIC_CITATIONS = [{"article": "Mediatsiya toʻgʻrisidagi qonun", "title": "Mediativ kelishuv", "url": LAW_URL}]


def ai_view(fn):
    """Common decorators: public, JSON, throttle scope "ai"."""
    fn = throttle_classes([ScopedRateThrottle])(fn)
    fn = permission_classes([AllowAny])(fn)
    return fn


def _scoped(view):
    view.cls.throttle_scope = "ai"
    return view


@lru_cache(maxsize=1)
def costs() -> dict:
    return json.loads((DATA / "costs.json").read_text(encoding="utf-8"))


def _json(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False)


# ---------------- classify ----------------


@_scoped
@api_view(["POST"])
@ai_view
def classify(request):
    text = str(request.data.get("text", "")).strip()
    if len(text) < 20:
        return Response({"detail": "Nizoni batafsilroq yozing"}, status=400)
    out = client.generate_json(prompts.CLASSIFY, [{"text": text}], Classification)
    if out:
        data, source = out.model_dump(), "ai"
        if data.get("amount_uzs") is None:
            data["amount_uzs"] = fallbacks.classify(text)["amount_uzs"]
    else:
        data, source = fallbacks.classify(text), "fallback"
    if fallbacks.is_criminal(text):  # criminal guard always wins
        data["mediable"] = False
        data["reason"] = fallbacks.CRIMINAL_REASON
    data["confidence"] = round(min(1.0, max(0.0, float(data.get("confidence", 0.7)))), 2)
    return Response({**data, "source": source})


# ---------------- compare ----------------


def _tracks(amount: int | None) -> tuple[dict, dict]:
    c = costs()
    bhm = c["bhm_uzs"]
    fee = max(round((amount or 0) * c["court_fee"]["percent"] / 100), c["court_fee"]["min_bhm"] * bhm)
    court_items = [{"label": "Davlat boji (taxminiy)", "uzs": fee}, {"label": "Advokat xizmati (taxminiy)", "uzs": c["lawyer_uzs"]}]
    med_total = c["mediator_session_uzs"] * c["mediation_sessions"]
    med_items = [{"label": f"Mediator haqi ({c['mediation_sessions']} sessiya, taxminiy)", "uzs": med_total}]
    court = {"days_min": c["court_days"][0], "days_max": c["court_days"][1], "cost_uzs": fee + c["lawyer_uzs"], "items": court_items}
    mediation = {"days_min": c["mediation_days"][0], "days_max": c["mediation_days"][1], "cost_uzs": med_total, "items": med_items}
    return court, mediation


@_scoped
@api_view(["POST"])
@ai_view
def compare(request):
    dtype = str(request.data.get("dispute_type", "boshqa"))
    amount = request.data.get("amount_uzs")
    amount = int(amount) if isinstance(amount, (int, float)) and amount > 0 else None
    court, mediation = _tracks(amount)
    prompt = _json({"nizo_turi": fallbacks.LABEL.get(dtype, dtype), "summa": amount, "sud": court, "mediatsiya": mediation})
    out = client.generate_json(prompts.COMPARE_NOTES, [{"text": prompt}], CompareNotes, total_s=14)
    notes, source = (out.notes[:3], "ai") if out and out.notes else (costs()["notes"][:2], "fallback")
    return Response({"court": court, "mediation": mediation, "notes": notes, "sources": costs()["sources"], "source": source})


# ---------------- invite ----------------


@_scoped
@api_view(["POST"])
@ai_view
def invite(request):
    d = request.data
    claimant, respondent = str(d.get("claimant_name", "")), str(d.get("respondent_name", ""))
    dtype, amount = str(d.get("dispute_type", "boshqa")), d.get("amount_uzs")
    prompt = _json(
        {"murojaatchi": claimant, "ikkinchi_tomon": respondent, "nizo_turi": fallbacks.LABEL.get(dtype, dtype), "summa_som": amount, "qisqacha": d.get("summary", "")}
    )
    out = client.generate_json(prompts.INVITE, [{"text": prompt}], InviteOut)
    if out and len(out.text) > 40:
        return Response({"text": out.text, "checks": out.checks[:3], "source": "ai"})
    return Response({**fallbacks.invite(claimant, respondent, dtype, amount), "source": "fallback"})


# ---------------- position / brief / agreement ----------------


@_scoped
@api_view(["POST"])
@ai_view
def position(request):
    d = request.data
    answers = d.get("answers") or []
    prompt = _json({"rol": d.get("role", "respondent"), "kontekst": d.get("summary", ""), "savol_javoblar": answers})
    out = client.generate_json(prompts.POSITION, [{"text": prompt}], Position)
    if out:
        return Response({**out.model_dump(), "source": "ai"})
    return Response({**fallbacks.position(answers), "source": "fallback"})


@_scoped
@api_view(["POST"])
@ai_view
def brief(request):
    d = request.data
    prompt = _json(
        {
            "nizo": d.get("summary", ""),
            "turi": fallbacks.LABEL.get(str(d.get("dispute_type")), d.get("dispute_type")),
            "summa_som": d.get("amount_uzs"),
            "murojaatchi_pozitsiyasi": d.get("claimant_position"),
            "ikkinchi_tomon_pozitsiyasi": d.get("respondent_position"),
        }
    )
    out = client.generate_json(prompts.BRIEF, [{"text": prompt}], Brief)
    if out:
        return Response({**out.model_dump(), "source": "ai"})
    fb = fallbacks.brief(str(d.get("summary", "")), d.get("amount_uzs"), d.get("claimant_position"), d.get("respondent_position"))
    return Response({**fb, "source": "fallback"})


def _citations(terms: list[str]) -> list[dict]:
    try:
        from .retrieval import _index  # B15: the agreement always rests on art. 29 (form) and 29¹ (enforcement)

        docs, _ = _index()
        hits = [d for d in docs if d["article"] in ("29-modda", "29¹-modda")]
        return [{"article": h["article"], "title": h["title"], "url": h["url"]} for h in hits] or STATIC_CITATIONS
    except Exception:  # noqa: BLE001 - corpus missing or not built yet
        return STATIC_CITATIONS


@_scoped
@api_view(["POST"])
@ai_view
def agreement(request):
    d = request.data
    terms = [str(t) for t in (d.get("terms") or [])]
    code = str(d.get("code", "MD-2026-0000"))
    prompt = _json(
        {
            "kod": code,
            "murojaatchi": d.get("claimant_name"),
            "ikkinchi_tomon": d.get("respondent_name"),
            "nizo_tavsifi_murojaatchi_soʻzi_bilan": d.get("summary", ""),
            "turi": fallbacks.LABEL.get(str(d.get("dispute_type")), d.get("dispute_type")),
            "summa_som": d.get("amount_uzs"),
            "malumotnoma": d.get("brief"),
            "kelishilgan_shartlar": terms,
        }
    )
    out = client.generate_json(prompts.AGREEMENT, [{"text": prompt}], Agreement)
    if out and out.clauses:
        data, source = out.model_dump(), "ai"
    else:
        data = fallbacks.agreement(code, str(d.get("claimant_name", "")), str(d.get("respondent_name", "")), str(d.get("dispute_type", "")), d.get("amount_uzs"), terms)
        source = "fallback"
    return Response({**data, "citations": _citations(terms), "source": source})


# ---------------- ask (law Q&A) ----------------


@_scoped
@api_view(["POST"])
@ai_view
def ask(request):
    q = str(request.data.get("question", "")).strip()
    if len(q) < 5:
        return Response({"detail": "Savolni toʻliqroq yozing"}, status=400)
    try:
        from .retrieval import top_k

        hits = top_k(q, k=3)
    except Exception:  # noqa: BLE001
        hits = []
    context = "\n\n".join(f"{h['article']}. {h['title']}\n{h['text']}" for h in hits)
    out = client.generate_json(prompts.ASK, [{"text": f"Moddalar:\n{context}\n\nSavol: {q}"}], AskOut) if hits else None
    cites = [{"article": h["article"], "title": h["title"], "url": h["url"]} for h in hits] or STATIC_CITATIONS
    if out:
        return Response({"answer": out.answer, "citations": cites, "source": "ai"})
    answer = (
        f"{hits[0]['article']}. {hits[0]['title']}: {hits[0]['text'][:400]}"
        if hits
        else "Bu savol boʻyicha mediator yoki yuristga murojaat qilishni tavsiya qilamiz."
    )
    return Response({"answer": answer, "citations": cites, "source": "fallback"})


# ---------------- transcribe ----------------


@_scoped
@api_view(["POST"])
@ai_view
@parser_classes([MultiPartParser, JSONParser])
def transcribe(request):
    f = request.FILES.get("audio")
    if not f:
        return Response({"detail": "Audio fayl topilmadi"}, status=400)
    if f.size > 3 * 1024 * 1024:
        return Response({"detail": "Yozuv juda uzun (60 soniyagacha)"}, status=400)
    ffmpeg = os.environ.get("FFMPEG_BIN", "ffmpeg")
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / f"in{Path(f.name).suffix or '.webm'}"
        dst = Path(tmp) / "out.ogg"
        src.write_bytes(f.read())
        try:
            subprocess.run(
                [ffmpeg, "-y", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", "16000", "-c:a", "libopus", str(dst)],
                check=True,
                timeout=20,
            )
            audio = dst.read_bytes()
        except (OSError, subprocess.SubprocessError) as exc:
            log.warning("[ai] ffmpeg failed: %s", type(exc).__name__)
            return Response({"text": "", "source": "fallback"})
    parts = [{"inline_data": {"mime_type": "audio/ogg", "data": base64.b64encode(audio).decode()}}, {"text": prompts.TRANSCRIBE}]
    text = client.generate_text("Sen aniq nutqni matnga aylantiruvchisan.", parts, total_s=20, attempt_s=12)
    return Response({"text": (text or "").strip(), "source": "ai" if text else "fallback"})
