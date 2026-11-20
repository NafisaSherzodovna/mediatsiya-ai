from django.conf import settings
from django.db import models

from cases.models import Region


class Mediator(models.Model):
    id = models.CharField(primary_key=True, max_length=10)  # "m-01"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField("F.I.Sh.", max_length=120)
    photo = models.CharField("Rasm", max_length=200, blank=True)
    registry_no = models.CharField("Reyestr raqami", max_length=20)
    specialties = models.JSONField("Mutaxassislik", default=list)
    languages = models.JSONField("Tillar", default=list)
    region = models.CharField("Hudud", max_length=20, choices=Region.choices)
    price_uzs = models.PositiveIntegerField("Narx (soʻm)")
    rating = models.FloatField("Reyting", default=0)
    sessions = models.PositiveIntegerField("Sessiyalar", default=0)
    years = models.PositiveIntegerField("Tajriba (yil)", default=0)
    bio = models.TextField("Maʼlumot", blank=True)
    is_demo = models.BooleanField("Demo", default=True)

    class Meta:
        verbose_name = "Mediator"
        verbose_name_plural = "Mediatorlar"
        ordering = ["-rating"]

    def __str__(self):
        return self.name
