from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path


def health(request):
    return JsonResponse({"ok": True, "ai": bool(settings.GEMINI_API_KEYS)})


urlpatterns = [
    re_path(r"^api/health/?$", health),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("cases.urls")),
    path("api/", include("mediators.urls")),
    path("api/stats/", include("stats.urls")),
    path("api/ai/", include("ai.urls")),
    path("api/demo/", include("demo.urls")),
    path("admin/", admin.site.urls),
]
