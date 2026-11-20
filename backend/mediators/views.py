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
        m for m in Mediator.objects.all()
        if (not q.get("dispute_type") or q["dispute_type"] in m.specialties)
        and (not q.get("region") or m.region == q["region"])
        and (not q.get("lang") or q["lang"] in m.languages)
    ]
    return Response(MediatorSerializer(rows, many=True).data)
