from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.views import role_of
from mediators.models import Mediator

from .models import Case, CaseEvent, CaseStatus, Review
from .procedure import clear_procedure, default_language, expire_due, expire_if_due, terms
from .serializers import CaseSerializer

EVENT_LABELS = {
    "created": "Murojaat yaratildi",
    "invited": "Ikkinchi tomonga taklif yuborildi",
    "accepted": "Ikkinchi tomon rozi boʻldi",
    "declined": "Ikkinchi tomon rad etdi",
    "scheduled": "Ikkinchi tomon mediatorni tasdiqladi, sessiya belgilandi",
    "mediator_proposed": "Murojaatchi mediatorni taklif qildi",
    "mediator_rejected": "Ikkinchi tomon taklif qilingan mediatorni rad etdi",
    "mediator_dropped_claimant": "Murojaatchi mediatordan voz kechdi",
    "mediator_dropped_respondent": "Ikkinchi tomon mediatordan voz kechdi",
    "refunded": "Toʻlangan mediator haqi tomonlarga qaytarildi",
    "mediator_dropped_mediator": "Mediator ishni rad etdi (9, 13-moddalar)",
    "terminated_claimant": "Murojaatchi mediatsiyani tugatdi",
    "terminated_respondent": "Ikkinchi tomon mediatsiyani tugatdi",
    "terminated_mediator": "Mediator: kelishuvga erishish imkoni yoʻq, mediatsiya tugatildi",
    "terminated_expired": "Mediatsiya muddati oʻtdi, mediatsiya tugatildi (23, 24-moddalar)",
    "paid_out": "Uchrashuv oʻtkazilgani uchun mediator haqi mediatorga oʻtkazildi",
    "extension_requested_claimant": "Murojaatchi muddatni 30 kunga uzaytirishni soʻradi",
    "extension_requested_respondent": "Ikkinchi tomon muddatni 30 kunga uzaytirishni soʻradi",
    "extended": "Taraflar roziligi bilan muddat 30 kunga uzaytirildi (23-modda)",
    "agreed": "Kelishuvga erishildi",
    "closed": "Ish yopildi",
    "paid_claimant": "Murojaatchi mediator haqining ulushini toʻladi",
    "paid_respondent": "Ikkinchi tomon mediator haqining ulushini toʻladi",
    "reviewed": "Murojaatchi mediatorni baholadi",
}
CREATE_FIELDS = [
    "description", "dispute_type", "region", "amount_uzs", "respondent", "classification", "comparison",
    "invite_text", "claimant_position",
]
PATCH_FIELDS = [
    "status", "classification", "comparison", "invite_text", "claimant_position", "brief", "agreement", "region",
    "amount_uzs", "respondent",
]


def add_event(case, kind):
    CaseEvent.objects.create(case=case, kind=kind, label=EVENT_LABELS.get(kind, kind))


def set_status(case, status):
    if case.status != status:
        case.status = status
        if status == CaseStatus.AGREED and not case.agreed_at:
            case.agreed_at = timezone.now()
            if case.mediator_id:
                Mediator.objects.filter(pk=case.mediator_id).update(resolved=F("resolved") + 1)
        case.save()
        add_event(case, status)


def visible_cases(user):
    qs = Case.objects.select_related("claimant__profile", "mediator", "proposed_mediator", "review").prefetch_related("events")
    role = role_of(user)
    if role == "admin":
        return qs
    if role == "mediator":
        return qs.filter(mediator__user=user)
    return qs.filter(claimant=user)


def next_code():
    year = timezone.localdate().year
    n = Case.objects.count() + 1
    while Case.objects.filter(code=f"MD-{year}-{n:04d}").exists():  # seeded codes may skip numbers
        n += 1
    return f"MD-{year}-{n:04d}"


def pick(data, fields):
    return {k: data[k] for k in fields if k in data}


def invalid(ser):
    """The web client shows only `detail`, so flatten DRF field errors into it (None when valid)."""
    if ser.is_valid():
        return None
    return Response({"detail": "Notoʻgʻri maʼlumot: " + ", ".join(ser.errors)}, status=400)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def case_list(request):
    if request.method == "GET":
        expire_due()
        return Response(CaseSerializer(visible_cases(request.user)[:50], many=True).data)
    if len(str(request.data.get("description") or "").strip()) < 20:
        return Response({"detail": "Nizoni batafsilroq yozing"}, status=400)
    ser = CaseSerializer(data=pick(request.data, CREATE_FIELDS))
    if error := invalid(ser):
        return error
    invited = bool(ser.validated_data.get("invite_text", "").strip())
    with transaction.atomic():
        case = ser.save(
            claimant=request.user, code=next_code(), status=CaseStatus.INVITED if invited else CaseStatus.NEW
        )
        add_event(case, "created")
        if invited:
            add_event(case, "invited")
    return Response(CaseSerializer(visible_cases(request.user).get(pk=case.pk)).data, status=201)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def case_detail(request, pk):
    case = expire_if_due(get_object_or_404(visible_cases(request.user), pk=pk))
    if request.method == "PATCH":
        ser = CaseSerializer(case, data=pick(request.data, PATCH_FIELDS), partial=True)
        if error := invalid(ser):
            return error
        status = ser.validated_data.pop("status", None)
        if status == CaseStatus.AGREED and case.status != CaseStatus.SCHEDULED:
            return Response({"detail": "Kelishuvni faqat mediatsiya davom etayotganda muhrlash mumkin"}, status=400)
        if status == CaseStatus.AGREED:
            from rooms.logic import both_approved  # B: rooms app

            probe = Case(agreement=ser.validated_data.get("agreement", case.agreement))
            probe.pk = case.pk
            if not both_approved(probe):
                return Response({"detail": "Ikkala tomon kelishuv loyihasini tasdiqlamagan"}, status=400)
        with transaction.atomic():
            ser.save()
            if status:
                set_status(case, status)
        case = visible_cases(request.user).get(pk=pk)
    return Response(CaseSerializer(case).data)


class BookSerializer(serializers.Serializer):
    mediator_id = serializers.CharField()
    session_at = serializers.DateTimeField()
    language = serializers.CharField(required=False, allow_blank=True)


def available_mediators():
    return Mediator.objects.filter(approved=True, removed_at__isnull=True)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def case_book(request, pk):
    """Art. 8, 22: the claimant only proposes a mediator; the case moves on once the respondent confirms."""
    case = get_object_or_404(Case, pk=pk, claimant=request.user)
    if case.status != CaseStatus.ACCEPTED:
        return Response({"detail": "Mediatorni ikkinchi tomon rozi boʻlgandan keyin taklif qilish mumkin"}, status=400)
    ser = BookSerializer(data=request.data)
    if error := invalid(ser):
        return error
    case.proposed_mediator = available_mediators().filter(pk=ser.validated_data["mediator_id"]).first()
    if case.proposed_mediator is None:
        return Response({"detail": "Bu mediator hozir mavjud emas"}, status=404)
    case.proposed_session_at = ser.validated_data["session_at"]
    lang = ser.validated_data.get("language") or default_language(case.proposed_mediator)
    if lang not in case.proposed_mediator.languages:
        return Response({"detail": "Mediator bu tilda mediatsiya oʻtkazmaydi"}, status=400)
    case.proposed_language = lang
    with transaction.atomic():
        case.save(update_fields=["proposed_mediator", "proposed_session_at", "proposed_language", "updated_at"])
        add_event(case, "mediator_proposed")
    return Response(CaseSerializer(visible_cases(request.user).get(pk=pk)).data)


def answer_proposal(case, mediator_id, accept):
    """The respondent confirms or rejects the proposed mediator. Returns an error Response or None."""
    if case.status != CaseStatus.ACCEPTED or not case.proposed_mediator_id:
        return Response({"detail": "Tasdiqlanadigan mediator taklifi yoʻq"}, status=400)
    if mediator_id != case.proposed_mediator_id:  # the claimant changed the proposal meanwhile
        return Response({"detail": "Mediator taklifi oʻzgardi, sahifani yangilang"}, status=409)
    with transaction.atomic():
        if accept:
            m = available_mediators().filter(pk=mediator_id).first()
            if m is None:
                return Response({"detail": "Bu mediator hozir mavjud emas"}, status=400)
            case.mediator, case.session_at = m, case.proposed_session_at
            case.fee_uzs = m.price_uzs  # escrow snapshot: later price changes don't touch this case
            # Art. 19, 20: confirming makes the written procedure agreement; the mediation starts now
            case.procedure = terms(case, m, case.proposed_language or default_language(m), timezone.now())
            case.procedure_deadline = timezone.datetime.fromisoformat(case.procedure["deadline"])
            case.extension_requested_by, case.extended = "", False
            case.proposed_mediator, case.proposed_session_at, case.proposed_language = None, None, ""
            case.save()
            set_status(case, CaseStatus.SCHEDULED)
        else:
            case.proposed_mediator, case.proposed_session_at = None, None
            case.save(update_fields=["proposed_mediator", "proposed_session_at", "updated_at"])
            add_event(case, "mediator_rejected")
    return None


def drop_mediator(case, party):
    """Art. 11: a party may refuse the mediator. Payments go back, and the room is wiped so the next
    mediator cannot read what was said in confidence (Art. 6, 27)."""
    from rooms.models import Approval, Meeting, Message

    if case.status != CaseStatus.SCHEDULED or not case.mediator_id:
        return Response({"detail": "Mediatordan faqat kelishuv imzolanguncha voz kechish mumkin"}, status=400)
    with transaction.atomic():
        paid = bool(case.claimant_paid_at or case.respondent_paid_at)
        Message.objects.filter(case=case).delete()
        Meeting.objects.filter(case=case).delete()
        Approval.objects.filter(case=case).delete()
        case.mediator = case.session_at = case.fee_uzs = None
        case.claimant_paid_at = case.respondent_paid_at = None
        case.brief = case.agreement = None
        clear_procedure(case)
        case.status = CaseStatus.ACCEPTED  # not set_status: that would log "rozi boʻldi" again
        case.save()
        add_event(case, f"mediator_dropped_{party}")
        if paid:
            add_event(case, "refunded")
    return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def case_drop_mediator(request, pk):
    case = get_object_or_404(Case, pk=pk, claimant=request.user)
    if error := drop_mediator(case, "claimant"):
        return error
    return Response(CaseSerializer(visible_cases(request.user).get(pk=pk)).data)


class ReviewSerializer(serializers.Serializer):
    stars = serializers.IntegerField(min_value=0, max_value=5)
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def case_review(request, pk):
    case = get_object_or_404(Case.objects.select_related("mediator"), pk=pk, claimant=request.user)
    if case.status not in (CaseStatus.AGREED, CaseStatus.CLOSED) or not case.mediator_id:
        return Response({"detail": "Baho faqat ish yakunlangandan keyin qoʻyiladi"}, status=400)
    if Review.objects.filter(case=case).exists():
        return Response({"detail": "Bu ish uchun baho allaqachon qoʻyilgan"}, status=400)
    ser = ReviewSerializer(data=request.data)
    if error := invalid(ser):
        return error
    stars = ser.validated_data["stars"]
    with transaction.atomic():
        Review.objects.create(case=case, stars=stars, comment=ser.validated_data.get("comment", "").strip())
        m = Mediator.objects.select_for_update().get(pk=case.mediator_id)
        # running average, so seeded ratings (no Review rows) keep their weight
        m.rating = round((m.rating * m.reviews + stars) / (m.reviews + 1), 2)
        m.reviews += 1
        m.save(update_fields=["rating", "reviews"])
        add_event(case, "reviewed")
    return Response(CaseSerializer(visible_cases(request.user).get(pk=pk)).data)


def pay_share(case, party):
    """Demo escrow: marks one party's half as paid. No card data reaches the server."""
    if not case.fee_uzs or case.status != CaseStatus.SCHEDULED:
        return Response({"detail": "Toʻlov faqat mediatsiya davomida qabul qilinadi"}, status=400)
    field = f"{party}_paid_at"
    if getattr(case, field):
        return Response({"detail": "Bu ulush allaqachon toʻlangan"}, status=400)
    with transaction.atomic():
        setattr(case, field, timezone.now())
        case.save(update_fields=[field, "updated_at"])
        add_event(case, f"paid_{party}")
    return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def case_pay(request, pk):
    case = get_object_or_404(Case, pk=pk, claimant=request.user)
    if error := pay_share(case, "claimant"):
        return error
    return Response(CaseSerializer(visible_cases(request.user).get(pk=pk)).data)


def invite_case(token):
    case = Case.objects.select_related("claimant__profile").filter(invite_token=token).first()
    if case is None:
        raise NotFound("Taklif topilmadi yoki muddati oʻtgan")
    return case


@api_view(["GET"])
@authentication_classes([])  # public: the respondent opens it on a phone without an account
def invite_detail(request, token):
    case = invite_case(token)
    profile = getattr(case.claimant, "profile", None)
    return Response({
        "code": case.code,
        "claimant_name": profile.full_name if profile else case.claimant.username,
        "dispute_type": case.dispute_type,
        "amount_uzs": case.amount_uzs,
        "invite_text": case.invite_text,
        "status": case.status,
    })


class RespondSerializer(serializers.Serializer):
    accept = serializers.BooleanField()
    position = serializers.JSONField(required=False, allow_null=True)


@api_view(["POST"])
@authentication_classes([])
def invite_respond(request, token):
    case = invite_case(token)
    ser = RespondSerializer(data=request.data)
    if error := invalid(ser):
        return error
    # Once a mediator is booked, a late tap on the old link must not roll the case back.
    if case.status in (CaseStatus.NEW, CaseStatus.INVITED, CaseStatus.ACCEPTED, CaseStatus.DECLINED):
        with transaction.atomic():
            case.respondent_position = ser.validated_data.get("position")
            case.save()
            set_status(case, CaseStatus.ACCEPTED if ser.validated_data["accept"] else CaseStatus.DECLINED)
    return Response({"status": case.status})


def phone_key(phone: str) -> str:
    """"+998 90 123-45-67" and "901234567" match: the last 9 digits."""
    return "".join(ch for ch in str(phone or "") if ch.isdigit())[-9:]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_invites(request):
    """Invitations addressed to the signed-in user's phone (the claimant typed it as the other party's number).
    shortcut: phones are not verified yet, so anyone registered with this number sees the invite; add SMS codes (FT-1)."""
    profile = getattr(request.user, "profile", None)
    key = phone_key(profile.phone if profile else "")
    if len(key) < 9:
        return Response([])
    rows = Case.objects.select_related("claimant__profile").exclude(claimant=request.user).exclude(respondent_phone="")
    out = []
    for c in rows.order_by("-created_at")[:500]:  # shortcut: phone match in Python; index a normalized column at scale
        if phone_key(c.respondent_phone) == key:
            p = getattr(c.claimant, "profile", None)
            out.append({"code": c.code, "claimant_name": p.full_name if p else c.claimant.username, "dispute_type": c.dispute_type,
                        "status": c.status, "invite_token": c.invite_token, "created_at": c.created_at})
    return Response(out[:20])
