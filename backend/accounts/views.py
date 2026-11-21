import uuid

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


def role_of(user):
    profile = getattr(user, "profile", None)
    return profile.role if profile else ("admin" if user.is_superuser else "claimant")


def user_json(user):
    from mediators.models import Mediator

    profile = getattr(user, "profile", None)
    role = role_of(user)
    # pending: a self-registered mediator the admin has not approved yet
    pending = role == "mediator" and Mediator.objects.filter(user=user, approved=False).exists()
    return {"id": str(user.id), "name": profile.full_name if profile else user.username, "role": role, "pending": pending}


@api_view(["POST"])
@authentication_classes([])  # public; a stale token must not block login
def login(request):
    username = str(request.data.get("username", "")).strip()
    # Case-insensitive: admins create users like "Ibrohim", people type "ibrohim".
    match = User.objects.filter(username__iexact=username).first()
    user = authenticate(
        username=match.username if match else username,
        password=str(request.data.get("password", "")),
    )
    if user is None:
        return Response({"detail": "Login yoki parol notoʻgʻri"}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": user_json(user)})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    """GET: the user plus their phone. PATCH {phone}: set it (admin-created users have no profile yet)."""
    from accounts.models import Profile

    user = request.user
    if request.method == "PATCH":
        try:
            phone = serializers.RegexField(r"^\+?[0-9 ()-]{9,20}$").run_validation(str(request.data.get("phone", "")).strip())
        except serializers.ValidationError:
            return Response({"detail": "Telefon raqamini toʻgʻri kiriting"}, status=400)
        profile, _ = Profile.objects.get_or_create(user=user, defaults={"full_name": user.get_full_name() or user.username, "role": role_of(user)})
        profile.phone = phone
        profile.save(update_fields=["phone"])
        user = User.objects.get(pk=user.pk)  # drop the cached reverse relation
    profile = getattr(user, "profile", None)
    return Response({**user_json(user), "phone": profile.phone if profile else ""})


def not_future(value):
    from django.utils import timezone

    if value > timezone.localdate():
        raise serializers.ValidationError("kelajak sana")
    return value


class MediatorApplication(serializers.Serializer):
    """The columns of the Ministry of Justice mediator registry (Art. 9³) plus the Art. 12 requirements."""

    registry_no = serializers.CharField(max_length=20)
    registry_date = serializers.DateField(validators=[not_future])
    areas = serializers.ListField(child=serializers.ChoiceField(choices=[]), min_length=1)
    languages = serializers.ListField(child=serializers.ChoiceField(choices=[]), min_length=1)
    region = serializers.ChoiceField(choices=[])
    address = serializers.CharField(min_length=5, max_length=200)
    email = serializers.EmailField()
    certificate_no = serializers.CharField(max_length=30)
    certificate_date = serializers.DateField(validators=[not_future])
    price_uzs = serializers.IntegerField(min_value=50_000, max_value=5_000_000)
    years = serializers.IntegerField(min_value=0, max_value=60)
    bio = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    # Art. 12: higher education, not a civil servant, no criminal record, full legal capacity
    declaration = serializers.BooleanField()

    def __init__(self, *args, **kwargs):
        from cases.models import Region
        from mediators.models import LANGUAGES, Area

        super().__init__(*args, **kwargs)
        self.fields["areas"].child.choices = Area.choices
        self.fields["languages"].child.choices = LANGUAGES
        self.fields["region"].choices = Region.choices

    def validate_declaration(self, value):
        if not value:
            raise serializers.ValidationError("kerak")
        return value


class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["claimant", "mediator"])  # never admin
    username = serializers.RegexField(r"^[A-Za-z0-9_.]{3,30}$")
    password = serializers.CharField(min_length=6, max_length=128)
    full_name = serializers.CharField(min_length=3, max_length=120)
    phone = serializers.RegexField(r"^\+?[0-9 ()-]{9,20}$")
    mediator = MediatorApplication(required=False)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("band")
        return value

    def validate(self, attrs):
        if attrs["role"] == "mediator" and not attrs.get("mediator"):
            raise serializers.ValidationError({"mediator": "kerak"})
        return attrs


FIELD_UZ = {
    "role": "rol", "username": "login (3–30 ta lotin harf yoki raqam)", "password": "parol (kamida 6 belgi)",
    "full_name": "F.I.Sh.", "phone": "telefon", "mediator": "mediator maʼlumotlari",
    "registry_no": "reyestr raqami", "registry_date": "reyestrga kiritilgan sana", "areas": "mediatsiya sohasi",
    "languages": "tillar", "region": "hudud", "address": "joylashgan yeri", "email": "elektron pochta",
    "certificate_no": "oʻquv kursi hujjati raqami", "certificate_date": "oʻquv kursi hujjati sanasi",
    "price_uzs": "narx", "years": "tajriba", "declaration": "12-modda talablariga muvofiqlik tasdigʻi",
}


def error_fields(errors):
    """Flatten nested serializer errors ({"mediator": {"email": [...]}}) into Uzbek field names."""
    out = []
    for k, v in errors.items():
        out += error_fields(v) if isinstance(v, dict) else [FIELD_UZ.get(k, k)]
    return out


@api_view(["POST"])
@authentication_classes([])
def register(request):
    from accounts.models import Profile, split_full_name
    from mediators.models import Mediator

    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        if "username" in ser.errors and "band" in ser.errors["username"]:
            return Response({"detail": "Bu login band, boshqasini tanlang"}, status=400)
        return Response({"detail": "Tekshiring: " + ", ".join(error_fields(ser.errors))}, status=400)
    d = ser.validated_data
    with transaction.atomic():
        first, last = split_full_name(d["full_name"])
        email = d["mediator"]["email"] if d["role"] == "mediator" else ""
        user = User.objects.create_user(username=d["username"], password=d["password"], first_name=first, last_name=last, email=email)
        Profile.objects.create(user=user, role=d["role"], full_name=d["full_name"].strip(), phone=d["phone"].strip())
        if d["role"] == "mediator":
            m = d["mediator"]
            Mediator.objects.create(
                id=f"m-{uuid.uuid4().hex[:7]}", user=user, name=d["full_name"].strip(), registry_no=m["registry_no"].strip(),
                registry_date=m["registry_date"], areas=m["areas"], languages=m["languages"], region=m["region"],
                address=m["address"].strip(), phone=d["phone"].strip(), email=m["email"], certificate_no=m["certificate_no"].strip(),
                certificate_date=m["certificate_date"], price_uzs=m["price_uzs"], years=m["years"], bio=m.get("bio", ""),
                rating=0, sessions=0, is_demo=False, approved=False,
            )
    token = Token.objects.create(user=user)
    return Response({"token": token.key, "user": user_json(user)}, status=201)
