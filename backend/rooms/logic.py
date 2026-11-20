"""Rules shared by the rooms views and the cases PATCH guard."""

from __future__ import annotations

import hashlib
import json

from django.db.models import Q

from .models import Approval, Meeting


def agreement_hash(agreement) -> str:
    if not agreement:
        return ""
    body = {"title": agreement.get("title"), "clauses": agreement.get("clauses")}
    return hashlib.sha1(json.dumps(body, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def approvals_state(case) -> dict:
    """{party: {decision, comment, at, current}} — `current` is False when the agreement changed after the answer."""
    h = agreement_hash(case.agreement)
    out = {"claimant": None, "respondent": None}
    for a in Approval.objects.filter(case=case):
        out[a.party] = {"decision": a.decision, "comment": a.comment, "at": a.at.isoformat(), "current": bool(h) and a.agreement_hash == h}
    return out


def both_approved(case) -> bool:
    s = approvals_state(case)
    return all(v and v["current"] and v["decision"] == "approved" for v in s.values())


def clash(case, start, end, exclude_id=None):
    """A live meeting of the same mediator (any case) that overlaps [start, end), or None."""
    if not case.mediator_id:
        return None
    qs = Meeting.objects.filter(case__mediator_id=case.mediator_id, status__in=[Meeting.Status.PROPOSED, Meeting.Status.ACCEPTED])
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    for m in qs.filter(Q(start__lt=end)).select_related("case"):
        if m.end > start:
            return m
    return None
