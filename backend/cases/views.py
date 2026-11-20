from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.views import role_of
from mediators.models import Mediator

from .models import Case, CaseEvent, CaseStatus
from .serializers import CaseSerializer

EVENT_LABELS = {
    "created": "Murojaat yaratildi",
    "invited": "Ikkinchi tomonga taklif yuborildi",
    "accepted": "Ikkinchi tomon rozi boʻldi",
    "declined": "Ikkinchi tomon rad etdi",
    "scheduled": "Mediator bilan sessiya belgilandi",
    "agreed": "Kelishuvga erishildi",
    "closed": "Ish yopildi",
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
        case.save()
        add_event(case, status)


def visible_cases(user):
    qs = Case.objects.select_related("claimant__profile", "mediator").prefetch_related("events")
    role = role_of(user)
    if role in ("ministry", "admin"):
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
    case = get_object_or_404(visible_cases(request.user), pk=pk)
    if request.method == "PATCH":
        ser = CaseSerializer(case, data=pick(request.data, PATCH_FIELDS), partial=True)
        if error := invalid(ser):
            return error
        status = ser.validated_data.pop("status", None)
        with transaction.atomic():
            ser.save()
            if status:
                set_status(case, status)
        case = visible_cases(request.user).get(pk=pk)
    return Response(CaseSerializer(case).data)


class BookSerializer(serializers.Serializer):
    mediator_id = serializers.CharField()
    session_at = serializers.DateTimeField()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def case_book(request, pk):
    case = get_object_or_404(visible_cases(request.user), pk=pk)
    ser = BookSerializer(data=request.data)
    if error := invalid(ser):
        return error
    case.mediator = get_object_or_404(Mediator, pk=ser.validated_data["mediator_id"])
    case.session_at = ser.validated_data["session_at"]
    with transaction.atomic():
        case.save()
        set_status(case, CaseStatus.SCHEDULED)
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
