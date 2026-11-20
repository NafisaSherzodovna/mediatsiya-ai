import hmac

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .seed import seed


@api_view(["POST"])
@permission_classes([AllowAny])
def reset(request):
    key = request.headers.get("X-Demo-Key", "")
    if not settings.DEMO_RESET_KEY or not hmac.compare_digest(key, settings.DEMO_RESET_KEY):
        return Response({"detail": "Kalit notoʻgʻri"}, status=403)
    return Response({"ok": True, "cases": seed(wipe=True)})
