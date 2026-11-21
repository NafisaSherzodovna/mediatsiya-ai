from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response

from cases.models import Case, DisputeType, Region


def court_fee(comparison):
    items = ((comparison or {}).get("court") or {}).get("items") or []
    return sum(int(i.get("uzs") or 0) for i in items if str(i.get("label", "")).startswith("Davlat boji"))


def last_months(n):
    today = timezone.localdate()
    y, m = today.year, today.month
    out = []
    for _ in range(n):
        out.append(f"{y}-{m:02d}")
        y, m = (y, m - 1) if m > 1 else (y - 1, 12)
    return out[::-1]


@api_view(["GET"])
@authentication_classes([])  # public: aggregated, no personal data; shown on the landing page
def stats(request):
    # shortcut: aggregates in Python over all rows; fine for hundreds of cases, move to SQL at ~10k
    rows = list(Case.objects.values("dispute_type", "region", "created_at", "agreed_at", "comparison", "mediator_id"))
    agreed = [r for r in rows if r["agreed_at"]]
    days = [(r["agreed_at"] - r["created_at"]).total_seconds() / 86400 for r in agreed]

    def tally(key, value, name):
        sel = [r for r in rows if r[key] == value]
        return {name: value, "count": len(sel), "agreed": sum(1 for r in sel if r["agreed_at"])}

    months = last_months(11)
    monthly = {m: [0, 0] for m in months}
    for r in rows:
        m = timezone.localtime(r["created_at"]).strftime("%Y-%m")
        if m in monthly:
            monthly[m][0] += 1
            monthly[m][1] += bool(r["agreed_at"])

    return Response({
        "totals": {
            "cases": len(rows),
            "agreed": len(agreed),
            "agreement_rate": round(len(agreed) / len(rows), 3) if rows else 0,
            "avg_days": round(sum(days) / len(days), 1) if days else 0,
            "refunded_fees_uzs": sum(court_fee(r["comparison"]) for r in agreed),
            "mediators_active": len({r["mediator_id"] for r in rows if r["mediator_id"]}),
        },
        "by_type": [tally("dispute_type", t, "type") for t in DisputeType.values],
        "by_region": [tally("region", g, "region") for g in Region.values],
        "monthly": [{"month": m, "cases": c, "agreed": a} for m, (c, a) in monthly.items()],
    })
