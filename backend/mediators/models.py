from django.conf import settings
from django.db import models

from cases.models import Region


class Area(models.TextChoices):
    """Mediation areas from Art. 3 of the Law "On Mediation" (the registry's "ixtisoslashgan mediatsiya sohasi")."""

    FUQAROLIK = "fuqarolik", "Fuqarolik"
    TADBIRKORLIK = "tadbirkorlik", "Tadbirkorlik"
    BANK = "bank", "Bank va mijoz"
    SUGURTA = "sugurta", "Sugʻurta"
    MEHNAT = "mehnat", "Mehnat"
    OILAVIY = "oilaviy", "Oilaviy"


# Which area a dispute type falls under, for "best fit" ranking and filtering.
AREA_OF_DISPUTE = {"mehnat": "mehnat", "oilaviy": "oilaviy"}  # everything else: fuqarolik

LANGUAGES = ["uz", "ru", "en", "kaa", "tr", "tg", "kk", "ky", "tk"]


class Mediator(models.Model):
    id = models.CharField(primary_key=True, max_length=10)  # "m-01"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField("F.I.Sh.", max_length=120)
    photo = models.CharField("Rasm", max_length=200, blank=True)
    registry_no = models.CharField("Reyestr raqami", max_length=20)
    registry_date = models.DateField("Reyestrga kiritilgan sana", null=True, blank=True)
    areas = models.JSONField("Ixtisoslashgan mediatsiya sohasi", default=list)
    languages = models.JSONField("Tillar", default=list)
    address = models.CharField("Joylashgan yeri", max_length=200, blank=True)
    phone = models.CharField("Telefon", max_length=20, blank=True)
    email = models.EmailField("Elektron pochta", blank=True)
    certificate_no = models.CharField("Oʻquv kursi hujjati raqami", max_length=30, blank=True)
    certificate_date = models.DateField("Oʻquv kursi hujjati sanasi", null=True, blank=True)
    removed_at = models.DateField("Reyestrdan chiqarilgan sana", null=True, blank=True)  # admin only; hides the mediator
    region = models.CharField("Hudud", max_length=20, choices=Region.choices)
    price_uzs = models.PositiveIntegerField("Narx (soʻm)")
    rating = models.FloatField("Reyting", default=0)
    sessions = models.PositiveIntegerField("Sessiyalar", default=0)
    resolved = models.PositiveIntegerField("Hal qilingan ishlar", default=0)
    reviews = models.PositiveIntegerField("Baholar soni", default=0)
    years = models.PositiveIntegerField("Tajriba (yil)", default=0)
    bio = models.TextField("Qoʻshimcha maʼlumot", blank=True)
    is_demo = models.BooleanField("Demo", default=True)
    approved = models.BooleanField("Tasdiqlangan", default=True)  # self-registered mediators start False

    class Meta:
        verbose_name = "Mediator"
        verbose_name_plural = "Mediatorlar"
        ordering = ["-rating", "-resolved"]

    def __str__(self):
        return self.name
