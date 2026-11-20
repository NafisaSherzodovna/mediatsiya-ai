"""Room endpoints (contract/api.md, "Rooms"). Mediator and claimant use their token; the respondent uses the invite token."""

from __future__ import annotations

from datetime import timedelta
from zoneinfo import ZoneInfo

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.views import role_of
from cases.models import Case

from .logic import agreement_hash, approvals_state, clash
from .models import Approval, Meeting, Message, Party

TZ = ZoneInfo("Asia/Tashkent")  # all people in a case live on Tashkent time
PARTY_LABEL = {"claimant": "murojaatchi", "respondent": "ikkinchi tomon"}


# ---------------- access ----------------


def case_for_user(request, case_id) -> tuple[Case, str]:
    """Returns (case, actor) where actor is "mediator" or "claimant"."""
    case = get_object_or_404(Case.objects.select_related("claimant__profile", "mediator"), pk=case_id)
    user = request.user
    if case.mediator and case.mediator.user_id == user.id:
        return case, "mediator"
    if case.claimant_id == user.id:
        return case, "claimant"
    if role_of(user) == "admin":
        return case, "mediator"
    raise NotFound("Ish topilmadi")


def case_for_token(token) -> Case:
    case = Case.objects.select_related("claimant__profile", "mediator").filter(invite_token=token).first()
    if case is None:
        raise NotFound("Taklif topilmadi yoki muddati oʻtgan")
    return case


def require_mediator(case):
    if not case.mediator_id:
        raise PermissionDenied("Mediator hali tayinlanmagan")


# ---------------- json ----------------


def name_of(case, party):
    if party == "claimant":
        p = getattr(case.claimant, "profile", None)
        return p.full_name if p else case.claimant.username
    return case.respondent_name or "Ikkinchi tomon"


def message_json(m: Message):
    return {"id": m.id, "party": m.party, "sender": m.sender, "text": m.text, "at": m.created_at.isoformat()}


def meeting_json(m: Meeting):
    return {
        "id": str(m.id), "party": m.party, "start": m.start.isoformat(), "minutes": m.minutes, "mode": m.mode,
        "place": m.place, "note": m.note, "status": m.status,
    }


def room_json(case, actor):
    """What the viewer may see. A party sees only its own chat and meetings."""
    parties = ["claimant", "respondent"] if actor == "mediator" else [actor]
    threads = []
    for p in parties:
        msgs = Message.objects.filter(case=case, party=p)
        last = msgs.last()
        unread = msgs.exclude(sender="mediator").filter(read_by_mediator=False).count() if actor == "mediator" else msgs.filter(sender="mediator", read_by_party=False).count()
        threads.append({"party": p, "name": name_of(case, p), "unread": unread, "last": message_json(last) if last else None})
    meetings = Meeting.objects.filter(case=case, party__in=parties).exclude(status=Meeting.Status.CANCELLED)
    return {
        "case_id": str(case.id),
        "code": case.code,
        "status": case.status,
        "viewer": actor,
        "mediator": {"name": case.mediator.name, "registry_no": case.mediator.registry_no} if case.mediator else None,
        "names": {"claimant": name_of(case, "claimant"), "respondent": name_of(case, "respondent")},
        "threads": threads,
        "meetings": [meeting_json(m) for m in meetings],
        "agreement": case.agreement,
        "agreement_hash": agreement_hash(case.agreement),
        "approvals": approvals_state(case),
    }


# ---------------- shared handlers ----------------


def handle_messages(request, case, actor, party):
    require_mediator(case)
    if party not in ("claimant", "respondent"):
        return Response({"detail": "Suhbat tanlanmagan"}, status=400)
    if request.method == "POST":
        text = str(request.data.get("text", "")).strip()
        if not text:
            return Response({"detail": "Xabar boʻsh"}, status=400)
        if len(text) > 2000:
            return Response({"detail": "Xabar juda uzun"}, status=400)
        m = Message.objects.create(
            case=case, party=party, sender=actor, text=text, read_by_mediator=actor == "mediator", read_by_party=actor != "mediator"
        )
        return Response(message_json(m), status=201)
    qs = Message.objects.filter(case=case, party=party)
    if actor == "mediator":
        qs.exclude(sender="mediator").filter(read_by_mediator=False).update(read_by_mediator=True)
    else:
        qs.filter(sender="mediator", read_by_party=False).update(read_by_party=True)
    return Response([message_json(m) for m in qs])


def handle_answer(request, case, party, meeting_id):
    m = get_object_or_404(Meeting, pk=meeting_id, case=case, party=party)
    status = request.data.get("status")
    if status not in (Meeting.Status.ACCEPTED, Meeting.Status.DECLINED):
        return Response({"detail": "Notoʻgʻri javob"}, status=400)
    if m.status != Meeting.Status.PROPOSED:
        return Response({"detail": "Bu uchrashuvga allaqachon javob berilgan"}, status=400)
    m.status = status
    m.save(update_fields=["status"])
    verb = "qabul qildi" if status == Meeting.Status.ACCEPTED else "rad etdi"
    Message.objects.create(case=case, party=party, sender=party, text=f"Uchrashuvni {verb}: {m.start.astimezone(TZ):%d.%m %H:%M}", read_by_party=True)
    return Response(meeting_json(m))


def handle_approve(request, case, party):
    if not case.agreement:
        return Response({"detail": "Kelishuv loyihasi hali yoʻq"}, status=400)
    decision = request.data.get("decision")
    if decision not in ("approved", "changes"):
        return Response({"detail": "Notoʻgʻri qaror"}, status=400)
    comment = str(request.data.get("comment", ""))[:500]
    Approval.objects.update_or_create(
        case=case, party=party, defaults={"decision": decision, "comment": comment, "agreement_hash": agreement_hash(case.agreement), "at": timezone.now()}
    )
    text = "Kelishuv loyihasini tasdiqladi." if decision == "approved" else f"Kelishuvga oʻzgartirish soʻradi: {comment or '—'}"
    Message.objects.create(case=case, party=party, sender=party, text=text, read_by_party=True)
    return Response({"approvals": approvals_state(case)})


# ---------------- mediator / claimant ----------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def room(request, case_id):
    case, actor = case_for_user(request, case_id)
    return Response(room_json(case, actor))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def messages(request, case_id):
    case, actor = case_for_user(request, case_id)
    party = (request.query_params.get("party") or request.data.get("party")) if actor == "mediator" else actor
    return handle_messages(request, case, actor, party)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def meetings(request, case_id):
    case, actor = case_for_user(request, case_id)
    if actor != "mediator":
        raise PermissionDenied("Uchrashuvni faqat mediator belgilaydi")
    require_mediator(case)
    d = request.data
    party = d.get("party")
    start = parse_datetime(str(d.get("start", "")))
    minutes = int(d.get("minutes") or 45)
    if party not in ("claimant", "respondent") or not start:
        return Response({"detail": "Tomon va vaqtni tanlang"}, status=400)
    if timezone.is_naive(start):
        start = timezone.make_aware(start)
    if start < timezone.now():
        return Response({"detail": "Oʻtib ketgan vaqtni tanlab boʻlmaydi"}, status=400)
    if not 15 <= minutes <= 180:
        return Response({"detail": "Davomiylik 15–180 daqiqa boʻlishi kerak"}, status=400)
    other = clash(case, start, start + timedelta(minutes=minutes))
    if other:
        who = PARTY_LABEL[other.party] if other.case_id == case.id else f"boshqa ish ({other.case.code})"
        t = other.start.astimezone(TZ)
        return Response({"detail": f"Bu vaqtda {who} bilan uchrashuv bor ({t:%H:%M}, {other.minutes} daq.). Boshqa vaqt tanlang."}, status=409)
    m = Meeting.objects.create(
        case=case, party=party, start=start, minutes=minutes, mode=d.get("mode") or "online", place=str(d.get("place", ""))[:200], note=str(d.get("note", ""))[:300]
    )
    Message.objects.create(case=case, party=party, sender="mediator", text=f"Uchrashuv taklif qilindi: {start.astimezone(TZ):%d.%m %H:%M}, {minutes} daqiqa. Iltimos, tasdiqlang.", read_by_mediator=True)
    return Response(meeting_json(m), status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def meeting_action(request, meeting_id):
    m = get_object_or_404(Meeting.objects.select_related("case"), pk=meeting_id)
    case, actor = case_for_user(request, m.case_id)
    if actor == "mediator":
        if request.data.get("status") != Meeting.Status.CANCELLED:
            return Response({"detail": "Mediator faqat bekor qila oladi"}, status=400)
        m.status = Meeting.Status.CANCELLED
        m.save(update_fields=["status"])
        return Response(meeting_json(m))
    return handle_answer(request, case, actor, meeting_id)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve(request, case_id):
    case, actor = case_for_user(request, case_id)
    if actor != "claimant":
        raise PermissionDenied("Kelishuvni faqat tomonlar tasdiqlaydi")
    return handle_approve(request, case, "claimant")


# ---------------- respondent (invite token, no account) ----------------


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def t_room(request, token):
    return Response(room_json(case_for_token(token), "respondent"))


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def t_messages(request, token):
    return handle_messages(request, case_for_token(token), "respondent", "respondent")


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def t_meeting_answer(request, token, meeting_id):
    return handle_answer(request, case_for_token(token), "respondent", meeting_id)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def t_approve(request, token):
    return handle_approve(request, case_for_token(token), "respondent")
