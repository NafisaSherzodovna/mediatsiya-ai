from rest_framework import serializers

from .models import Mediator


class MediatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mediator
        exclude = ["user"]
