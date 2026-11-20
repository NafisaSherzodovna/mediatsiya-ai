from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def role_of(user):
    profile = getattr(user, "profile", None)
    return profile.role if profile else ("admin" if user.is_superuser else "claimant")


def user_json(user):
    profile = getattr(user, "profile", None)
    return {"id": str(user.id), "name": profile.full_name if profile else user.username, "role": role_of(user)}


@api_view(["POST"])
@authentication_classes([])  # public; a stale token must not block login
def login(request):
    user = authenticate(
        username=str(request.data.get("username", "")).strip().lower(),
        password=str(request.data.get("password", "")),
    )
    if user is None:
        return Response({"detail": "Login yoki parol notoʻgʻri"}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": user_json(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(user_json(request.user))
