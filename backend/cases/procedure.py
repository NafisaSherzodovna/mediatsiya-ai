"""The mediation procedure under the Law "On Mediation": the written procedure agreement (Art. 19, 20), its term
(Art. 23), and how a mediation ends without an agreement (Art. 7, 11, 24, 28).

The agreement text is a fixed template, not AI output: the respondent sees exactly this text before confirming.
"""

from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import COMMISSION_RATE, Case, CaseStatus, DisputeType

TERM_DAYS = 30  # Art. 23: the procedure should end within 30 days; the parties may extend it once by up to 30 days
LANG_NAME = {
    "uz": "oʻzbek", "ru": "rus", "en": "ingliz", "kaa": "qoraqalpoq", "tr": "turk", "tg": "tojik", "kk": "qozoq",
    "ky": "qirgʻiz", "tk": "turkman",
}
TERMINATED_LABEL = {
    "claimant": "Murojaatchi mediatsiyani tugatdi",
    "respondent": "Ikkinchi tomon mediatsiyani tugatdi",
    "mediator": "Mediator: kelishuvga erishish imkoni yoʻq, mediatsiya tugatildi",
    "expired": "Mediatsiya muddati oʻtdi, mediatsiya tugatildi",
}


def default_language(mediator) -> str:
    return "uz" if "uz" in mediator.languages else (mediator.languages or ["uz"])[0]


def _date(dt) -> str:
    return timezone.localtime(dt).strftime("%d.%m.%Y")


def _som(n: int) -> str:
    return f"{n:,}".replace(",", " ") + " soʻm"


def terms(case: Case, mediator, language: str, start) -> dict:
    """The procedure agreement for `case` with `mediator`, starting at `start`."""
    profile = getattr(case.claimant, "profile", None)
    claimant = profile.full_name if profile else case.claimant.username
    fee = mediator.price_uzs
    deadline = start + timedelta(days=TERM_DAYS)
    subject = (case.classification or {}).get("summary") or case.description
    amount = f", {_som(case.amount_uzs)}" if case.amount_uzs else ""
    clauses = [
        ("1. Taraflar", f"Murojaatchi: {claimant}. Ikkinchi tomon: {case.respondent_name or '—'}. Taraflar mediatsiyada shaxsan yoki vakili orqali ishtirok etadi (10-modda)."),
        ("2. Nizo predmeti", f"{DisputeType(case.dispute_type).label}{amount}: {subject[:400]}"),
        ("3. Mediator", f"{mediator.name}, Adliya vazirligi Mediatorlar reyestri № {mediator.registry_no}. Mediator mustaqil va xolis; mustaqilligiga taʼsir qiluvchi holat yuzaga kelsa, bu haqda taraflarga aytadi va mediatsiyadan voz kechadi (9, 13-moddalar)."),
        ("4. Tartib-taomil tartibi", "Mediator taraflar bilan birgalikda va har biri bilan alohida uchrashuvlar oʻtkazadi, ogʻzaki va yozma tavsiyalar beradi (13-modda). Muloqot Murosa platformasidagi maxfiy suhbat va uchrashuvlar orqali olib boriladi. Yarashishga majburlash taqiqlanadi (7-modda)."),
        ("5. Til va joy", f"Mediatsiya {LANG_NAME.get(language, language)} tilida oʻtkaziladi. Joy: onlayn, Murosa platformasi; yuzma-yuz uchrashuv kelishilsa, mediator manzili: {mediator.address or 'kelishiladi'}."),
        ("6. Sana va muddat", f"Mediatsiya {_date(start)} kuni, ushbu kelishuv tuzilgan kundan boshlanadi (19-modda) va {_date(deadline)} gacha ({TERM_DAYS} kun) tugallanishi kerak. Taraflarning oʻzaro roziligi bilan muddat bir marta {TERM_DAYS} kungacha uzaytirilishi mumkin; muddat oʻtsa, mediatsiya tugatiladi (23, 24-moddalar). Mediatsiya davomida daʼvo muddatining oʻtishi toʻxtatib turiladi (21-modda)."),
        ("7. Taraflarning huquqlari", "Har bir taraf mediatordan va mediatsiyaning istalgan bosqichida unda ishtirok etishdan voz kechishga haqli (7, 11-moddalar). Mediativ kelishuvga erishilsa, u yozma shaklda tuziladi, taraflar imzolaydi va mediator tasdiqlaydi; u majburiy kuchga ega, ixtiyoriy bajarilmasa sudga murojaat qilinadi (29, 29¹-moddalar)."),
        ("8. Maxfiylik", "Mediatsiya davomida maʼlum boʻlgan maʼlumotlar uni bergan tarafning yozma roziligisiz oshkor qilinmaydi. Mediator bir tarafdan olgan maʼlumotni ikkinchi tarafga faqat uning roziligi bilan aytadi (6, 26, 27-moddalar)."),
        ("9. Xarajatlar", f"Mediator haqi {_som(fee)}; taraflar teng ulushda, {_som(fee - fee // 2)} va {_som(fee // 2)} dan toʻlaydi (28-modda). Pul Murosa platformasi hisobida saqlanadi; mediativ kelishuv tuzilgach, {round(COMMISSION_RATE * 100)} % platforma xizmat haqi ushlab qolinib, qolgani mediatorga oʻtkaziladi. Mediator mediatsiyani rad etsa yoki taraf mediatordan voz kechsa, toʻlangan pul toʻliq qaytariladi. Mediatsiya kelishuvsiz tugatilsa: ikkala ulush toʻlangan va kamida bitta uchrashuv oʻtkazilgan boʻlsa, haq mediatorga oʻtkaziladi, aks holda toʻliq qaytariladi."),
    ]
    return {
        "title": f"Mediatsiya tartib-taomilini amalga oshirish toʻgʻrisidagi kelishuv № {case.code}",
        "language": language,
        "started_at": start.isoformat(),
        "deadline": deadline.isoformat(),
        "clauses": [{"title": t, "body": b} for t, b in clauses],
        "note": "Taraflar ushbu kelishuvga platformada elektron rozilik bildirgan: murojaatchi mediatorni taklif qilib, ikkinchi tomon uni tasdiqlab.",
    }


def preview(case: Case) -> dict | None:
    """What the respondent agrees to by confirming the proposed mediator (start = now, indicative)."""
    m = case.proposed_mediator
    if m is None:
        return None
    return {**terms(case, m, case.proposed_language or default_language(m), timezone.now()), "draft": True}


def clear_procedure(case: Case):
    case.procedure, case.procedure_deadline = None, None
    case.extension_requested_by, case.extended = "", False


def _held_session(case: Case) -> bool:
    from rooms.models import Meeting

    return Meeting.objects.filter(case=case, status=Meeting.Status.ACCEPTED, start__lt=timezone.now()).exists()


def terminate(case: Case, by: str, reason: str = "") -> None:
    """Art. 7, 24: end the mediation without an agreement. The money rule is clause 9 of the procedure agreement."""
    from .views import add_event

    with transaction.atomic():
        paid_any = bool(case.claimant_paid_at or case.respondent_paid_at)
        keep = bool(case.claimant_paid_at and case.respondent_paid_at) and _held_session(case)
        if paid_any and not keep:
            case.fee_uzs = case.claimant_paid_at = case.respondent_paid_at = None
        case.proposed_mediator, case.proposed_session_at, case.proposed_language = None, None, ""
        case.extension_requested_by = ""
        case.termination_reason = reason[:300]
        case.status = CaseStatus.TERMINATED
        case.save()
        add_event(case, f"terminated_{by}")
        if paid_any:
            add_event(case, "paid_out" if keep else "refunded")


def expire_if_due(case: Case) -> Case:
    if case.status == CaseStatus.SCHEDULED and case.procedure_deadline and case.procedure_deadline < timezone.now():
        terminate(case, "expired")
    return case


def expire_due() -> None:
    for case in Case.objects.filter(status=CaseStatus.SCHEDULED, procedure_deadline__lt=timezone.now()):
        terminate(case, "expired")


def can_terminate(case: Case, by: str) -> bool:
    allowed = {
        "claimant": {CaseStatus.NEW, CaseStatus.INVITED, CaseStatus.ACCEPTED, CaseStatus.SCHEDULED},
        "respondent": {CaseStatus.ACCEPTED, CaseStatus.SCHEDULED},  # before accepting, the respondent simply declines
        "mediator": {CaseStatus.SCHEDULED},
    }
    return case.status in allowed[by]


def extend(case: Case, party: str) -> str | None:
    """Art. 23: one party asks, the other agrees; once, by 30 days, before the term ends. Returns an error or None."""
    from .views import add_event

    if case.status != CaseStatus.SCHEDULED or not case.procedure_deadline:
        return "Muddatni faqat mediatsiya davomida uzaytirish mumkin"
    if case.extended:
        return "Muddat allaqachon bir marta uzaytirilgan"
    if case.extension_requested_by == party:
        return "Siz allaqachon soʻragansiz, ikkinchi tomon roziligi kutilmoqda"
    if case.extension_requested_by:  # the other party asked: this is the mutual consent
        case.procedure_deadline += timedelta(days=TERM_DAYS)
        case.extended, case.extension_requested_by = True, ""
        if case.procedure:
            case.procedure = {**case.procedure, "deadline": case.procedure_deadline.isoformat(), "extended": True}
        case.save()
        add_event(case, "extended")
    else:
        case.extension_requested_by = party
        case.save(update_fields=["extension_requested_by", "updated_at"])
        add_event(case, f"extension_requested_{party}")
    return None
