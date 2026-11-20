"""Rule and template answers used when the model fails or no key is set (source = "fallback")."""

from __future__ import annotations

import re

from .text import amount_from, normalize

LABEL = {
    "qarz": "Qarz",
    "ijara": "Ijara",
    "oilaviy": "Oilaviy",
    "istemolchi": "Isteʼmolchi huquqi",
    "mehnat": "Mehnat",
    "qoshnichilik": "Qoʻshnichilik",
    "boshqa": "Boshqa",
}

RULES: list[tuple[str, re.Pattern]] = [
    ("ijara", re.compile(r"ijara|kvartira|uy egasi|ijarachi|arenda")),
    ("qarz", re.compile(r"qarz|pul berib|qaytarmayapti|qaytarmadi|dolg")),
    ("oilaviy", re.compile(r"ajrash|aliment|turmush|er-xotin|qaynona|razvod")),
    ("mehnat", re.compile(r"ish haqi|maosh|ishdan|ish beruvchi|oylik|zarplat")),
    ("istemolchi", re.compile(r"doʻkon|dokon|mahsulot|xizmat|kafolat|qaytarish|buzuq|magazin")),
    ("qoshnichilik", re.compile(r"qoʻshni|qoshni|sosed")),
]

CRIMINAL = re.compile(r"urdi|kaltak|oʻgʻirla|ogirla|pichoq|zoʻrla|zorla|oʻldir|oldir|giyohvand|tahdid|ukral|izbil")
CRIMINAL_REASON = (
    "Bu holat jinoyat belgilariga ega. Mediatsiya qoʻllanmaydi — ichki ishlar organlari yoki prokuraturaga murojaat qiling."
)


def is_criminal(text: str) -> bool:
    return bool(CRIMINAL.search(normalize(text)))


def classify(text: str) -> dict:
    t = normalize(text)
    dtype = next((name for name, rx in RULES if rx.search(t)), "boshqa")
    criminal = bool(CRIMINAL.search(t))
    summary = text.strip()
    if len(summary) > 160:
        summary = summary[:157].rstrip() + "…"
    return {
        "dispute_type": dtype,
        "mediable": not criminal,
        "reason": CRIMINAL_REASON
        if criminal
        else f"{LABEL[dtype]} boʻyicha fuqarolik nizosi. Mediatsiya toʻgʻrisidagi qonun bunday nizolarga qoʻllanadi.",
        "summary": summary,
        "amount_uzs": amount_from(text),
        "confidence": 0.55 if dtype == "boshqa" else 0.8,
    }


def invite(claimant_name: str, respondent_name: str, dispute_type: str, amount_uzs: int | None) -> dict:
    first = (respondent_name or "").split(" ")[0] or "hurmatli tomon"
    topic = LABEL.get(dispute_type, "Boshqa").lower()
    money = f" ({amount_uzs:,} soʻm)".replace(",", " ") if amount_uzs else ""
    text = (
        f"Assalomu alaykum, {first}. Oramizdagi {topic} masalasini{money} sudga bormasdan, betaraf mediator yordamida "
        "tinch hal qilishni taklif qilaman. Bu ikkalamiz uchun ham tezroq va arzonroq, suhbat maxfiy boʻladi, "
        "kelishuv shartlarini esa birga belgilaymiz. Rozi boʻlsangiz, havola orqali javob bering. "
        f"Hurmat bilan, {claimant_name}."
    )
    return {"text": text, "checks": ["Ayblovsiz ohang", "Ikkala tomon uchun foyda", "Aniq keyingi qadam"]}


def position(answers: list[dict]) -> dict:
    a = [(x.get("a") or "").strip() for x in answers] + ["", "", ""]
    situation, wants, offer = a[0], a[1], a[2]
    return {
        "wants": [wants] if wants else ["Masalani tinch hal qilish"],
        "can_offer": [offer] if offer else ["Muzokaraga tayyor"],
        "concerns": [situation[:120]] if situation else [],
        "summary": " ".join(x for x in [situation, f"Xohlaydi: {wants}." if wants else "", f"Taklif: {offer}." if offer else ""] if x)
        or "Tomon muzokaraga tayyor.",
    }


def _words(items: list[str]) -> set[str]:
    return {w for s in items for w in re.findall(r"[\wʻ]{4,}", normalize(s))}


def brief(summary: str, amount_uzs: int | None, cp: dict | None, rp: dict | None) -> dict:
    cp = cp or {}
    rp = rp or {}
    cw, rw = cp.get("wants", []), rp.get("wants", [])
    shared = _words(cw + cp.get("can_offer", [])) & _words(rw + rp.get("can_offer", []))
    common = ["Ikkala tomon masalani sudsiz hal qilishga rozi"]
    if shared:
        common.append("Umumiy tayanch: " + ", ".join(sorted(shared)[:4]))
    offer = (rp.get("can_offer") or ["boʻlib toʻlash"])[0].strip().rstrip(".;")
    facts = [summary] + ([f"Nizo summasi: {amount_uzs:,} soʻm".replace(",", " ")] if amount_uzs else [])
    return {
        "facts": facts,
        "claimant_wants": cw or ["Haqini toʻliq olish"],
        "respondent_wants": rw or ["Imkoniyatiga mos yechim"],
        "common_ground": common,
        "zopa": f"Ikkinchi tomon taklifi asosida: {offer}; kafolat sharti bilan.",
        "suggested_options": ["Boʻlib toʻlash jadvali", "Kechikish uchun aniq oqibat", "Yozma kelishuv va ixtiyoriy ijro"],
        "risks": rp.get("concerns", [])[:2] or ["Majburiyat bajarilmasligi xavfi"],
    }


def agreement(code: str, claimant: str, respondent: str, dispute_type: str, amount_uzs: int | None, terms: list[str]) -> dict:
    money = f"{amount_uzs:,} soʻm".replace(",", " ") if amount_uzs else "kelishilgan summa"
    agreed = "; ".join(t.strip().rstrip(".;") for t in terms) if terms else f"{money} kelishilgan jadval asosida toʻlanadi"
    return {
        "title": f"Mediativ kelishuv № {code}",
        "clauses": [
            {"title": "1. Tomonlar", "body": f"{claimant} va {respondent}, mediator ishtirokida."},
            {"title": "2. Nizo predmeti", "body": f"{LABEL.get(dispute_type, 'Boshqa')} boʻyicha nizo, summa: {money}."},
            {"title": "3. Kelishilgan shartlar", "body": agreed + "."},
            {"title": "4. Kafolat", "body": "Majburiyat ikki marta ketma-ket bajarilmasa, ikkinchi tomon sudga murojaat qilishi mumkin."},
            {"title": "5. Ijro", "body": "Kelishuv tomonlar tomonidan ixtiyoriy bajariladi. Kelishuv bajarilmasa, sudga murojaat qilish huquqi saqlanadi."},
        ],
    }
