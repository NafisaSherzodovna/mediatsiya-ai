from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response

from .models import Mediator
from .serializers import MediatorSerializer


@api_view(["GET"])
@authentication_classes([])  # public; a stale token must not turn this into 401
def mediator_list(request):
    q = request.query_params
    # shortcut: filters JSON lists in Python (SQLite has no JSON contains); fine for a few dozen rows
    rows = [
        m for m in Mediator.objects.filter(approved=True, removed_at__isnull=True)
        if (not q.get("area") or q["area"] in m.areas)
        and (not q.get("region") or m.region == q["region"])
        and (not q.get("lang") or q["lang"] in m.languages)
        and (not q.get("q") or q["q"].strip().lower() in f"{m.name} {m.registry_no}".lower())
    ]
    if not q.get("page"):  # the plain array, as before
        return Response(MediatorSerializer(rows, many=True).data)
    try:
        size = min(max(int(q.get("page_size", 10)), 1), 50)
        page = max(int(q["page"]), 1)
    except ValueError:
        return Response({"detail": "Notoʻgʻri sahifa"}, status=400)
    pages = max((len(rows) + size - 1) // size, 1)
    page = min(page, pages)
    chunk = rows[(page - 1) * size : page * size]
    return Response({"count": len(rows), "page": page, "pages": pages, "results": MediatorSerializer(chunk, many=True).data})
