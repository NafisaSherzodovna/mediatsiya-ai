import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class DisputeType(models.TextChoices):
    QARZ = "qarz", "Qarz"
    IJARA = "ijara", "Ijara"
    OILAVIY = "oilaviy", "Oilaviy"
    ISTEMOLCHI = "istemolchi", "Isteʼmolchi huquqi"
    MEHNAT = "mehnat", "Mehnat"
    QOSHNICHILIK = "qoshnichilik", "Qoʻshnichilik"
    BOSHQA = "boshqa", "Boshqa"


class CaseStatus(models.TextChoices):
    NEW = "new", "Yangi"
    INVITED = "invited", "Taklif yuborildi"
    ACCEPTED = "accepted", "Rozi boʻldi"
    DECLINED = "declined", "Rad etildi"
    SCHEDULED = "scheduled", "Sessiya belgilandi"
    AGREED = "agreed", "Kelishuv"
    CLOSED = "closed", "Yopildi"


class Region(models.TextChoices):
    TOSHKENT_SH = "toshkent-sh", "Toshkent shahri"
    TOSHKENT_V = "toshkent-v", "Toshkent viloyati"
    ANDIJON = "andijon", "Andijon"
    FARGONA = "fargona", "Fargʻona"
    NAMANGAN = "namangan", "Namangan"
    SAMARQAND = "samarqand", "Samarqand"
    BUXORO = "buxoro", "Buxoro"
    NAVOIY = "navoiy", "Navoiy"
    QASHQADARYO = "qashqadaryo", "Qashqadaryo"
    SURXONDARYO = "surxondaryo", "Surxondaryo"
    JIZZAX = "jizzax", "Jizzax"
    SIRDARYO = "sirdaryo", "Sirdaryo"
    XORAZM = "xorazm", "Xorazm"
    QORAQALPOGISTON = "qoraqalpogiston", "Qoraqalpogʻiston"


def new_token():
    return uuid.uuid4().hex


class Case(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField("Raqam", max_length=20, unique=True)  # "MD-2026-0042"
    status = models.CharField("Holat", max_length=16, choices=CaseStatus.choices, default=CaseStatus.NEW)
    dispute_type = models.CharField("Nizo turi", max_length=16, choices=DisputeType.choices)
    region = models.CharField("Hudud", max_length=20, choices=Region.choices)
    amount_uzs = models.BigIntegerField("Summa (soʻm)", null=True, blank=True)
    description = models.TextField("Tavsif")
    claimant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cases", verbose_name="Murojaatchi"
    )
    respondent_name = models.CharField("Ikkinchi tomon", max_length=120, blank=True)
    respondent_phone = models.CharField("Ikkinchi tomon telefoni", max_length=20, blank=True)
    invite_token = models.CharField(max_length=64, unique=True, default=new_token, editable=False)
    classification = models.JSONField("AI tasnif", null=True, blank=True)
    comparison = models.JSONField("Sud va mediatsiya", null=True, blank=True)
    claimant_position = models.JSONField("Murojaatchi pozitsiyasi", null=True, blank=True)
    respondent_position = models.JSONField("Ikkinchi tomon pozitsiyasi", null=True, blank=True)
    brief = models.JSONField("Mediator uchun xulosa", null=True, blank=True)
    agreement = models.JSONField("Kelishuv", null=True, blank=True)
    invite_text = models.TextField("Taklif matni", blank=True)
    mediator = models.ForeignKey(
        "mediators.Mediator", null=True, blank=True, on_delete=models.SET_NULL, related_name="cases",
        verbose_name="Mediator",
    )
    session_at = models.DateTimeField("Sessiya vaqti", null=True, blank=True)
    agreed_at = models.DateTimeField("Kelishuv sanasi", null=True, blank=True)
    created_at = models.DateTimeField("Yaratilgan", default=timezone.now)  # not auto_now_add: seed backdates
    updated_at = models.DateTimeField("Yangilangan", auto_now=True)

    class Meta:
        verbose_name = "Ish"
        verbose_name_plural = "Ishlar"
        ordering = ["-created_at"]

    def __str__(self):
        return self.code


class CaseEvent(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="events")
    kind = models.CharField("Turi", max_length=20)
    label = models.CharField("Tavsif", max_length=120)
    at = models.DateTimeField("Vaqt", default=timezone.now)

    class Meta:
        verbose_name = "Hodisa"
        verbose_name_plural = "Hodisalar"
        ordering = ["at"]

    def __str__(self):
        return self.label
