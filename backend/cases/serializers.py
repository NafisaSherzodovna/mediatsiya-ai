from rest_framework import serializers

from accounts.views import user_json
from mediators.serializers import MediatorSerializer

from .models import Case, CaseEvent


class CaseEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseEvent
        fields = ["kind", "label", "at"]


class CaseSerializer(serializers.ModelSerializer):
    claimant = serializers.SerializerMethodField()
    respondent = serializers.DictField(write_only=True, required=False)  # {name, phone}
    mediator = MediatorSerializer(read_only=True)
    events = CaseEventSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = [
            "id", "code", "status", "dispute_type", "region", "amount_uzs", "description", "claimant",
            "respondent", "invite_token", "classification", "comparison", "invite_text", "claimant_position",
            "respondent_position", "brief", "mediator", "session_at", "agreement", "agreed_at", "events",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "code", "invite_token", "respondent_position", "session_at", "agreed_at", "created_at",
            "updated_at",
        ]

    def get_claimant(self, case):
        u = user_json(case.claimant)
        profile = getattr(case.claimant, "profile", None)
        return {"id": u["id"], "name": u["name"], "phone": profile.phone if profile else ""}

    def validate_respondent(self, value):
        return {"respondent_name": str(value.get("name") or ""), "respondent_phone": str(value.get("phone") or "")}

    def validate(self, attrs):
        attrs.update(attrs.pop("respondent", {}))
        return attrs

    def to_representation(self, case):
        data = super().to_representation(case)
        data["respondent"] = {"name": case.respondent_name, "phone": case.respondent_phone}
        return data
