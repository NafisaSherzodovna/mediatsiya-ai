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
    TERMINATED = "terminated", "Tugatildi"  # Art. 24: ended without a mediative agreement


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


COMMISSION_RATE = 0.10  # platform fee kept from the mediator fee; the rest is paid out to the mediator


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
    # Art. 8, 22: the parties choose the mediator together. The claimant proposes, the respondent confirms.
    proposed_mediator = models.ForeignKey(
        "mediators.Mediator", null=True, blank=True, on_delete=models.SET_NULL, related_name="proposals",
        verbose_name="Taklif qilingan mediator",
    )
    proposed_session_at = models.DateTimeField("Taklif qilingan sessiya vaqti", null=True, blank=True)
    proposed_language = models.CharField("Taklif qilingan til", max_length=4, blank=True)
    # Art. 19, 20, 23: the written procedure agreement, frozen when the respondent confirms the mediator
    procedure = models.JSONField("Tartib-taomil kelishuvi", null=True, blank=True)
    procedure_deadline = models.DateTimeField("Mediatsiya muddati", null=True, blank=True)
    extension_requested_by = models.CharField("Muddat uzaytirishni soʻragan", max_length=12, blank=True)
    extended = models.BooleanField("Muddat uzaytirilgan", default=False)
    termination_reason = models.CharField("Tugatish sababi", max_length=300, blank=True)
    fee_uzs = models.PositiveIntegerField("Mediator haqi (soʻm)", null=True, blank=True)  # snapshot at booking
    claimant_paid_at = models.DateTimeField("Murojaatchi toʻladi", null=True, blank=True)
    respondent_paid_at = models.DateTimeField("Ikkinchi tomon toʻladi", null=True, blank=True)
    agreed_at = models.DateTimeField("Kelishuv sanasi", null=True, blank=True)
    created_at = models.DateTimeField("Yaratilgan", default=timezone.now)  # not auto_now_add: seed backdates
    updated_at = models.DateTimeField("Yangilangan", auto_now=True)

    class Meta:
        verbose_name = "Ish"
        verbose_name_plural = "Ishlar"
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    def payment(self):
        """Escrow view of the mediator fee: split 50/50, the odd soʻm goes to the claimant."""
        if not self.fee_uzs:
            return None
        both = bool(self.claimant_paid_at and self.respondent_paid_at)
        commission = round(self.fee_uzs * COMMISSION_RATE)
        return {
            "fee_uzs": self.fee_uzs,
            "commission_uzs": commission,
            "mediator_payout_uzs": self.fee_uzs - commission,
            "claimant_share_uzs": self.fee_uzs - self.fee_uzs // 2,
            "respondent_share_uzs": self.fee_uzs // 2,
            "claimant_paid_at": self.claimant_paid_at,
            "respondent_paid_at": self.respondent_paid_at,
            "status": ("released" if self.status in ("agreed", "closed", "terminated") else "held") if both else "pending",
        }


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


class Review(models.Model):
    case = models.OneToOneField(Case, on_delete=models.CASCADE, related_name="review")
    stars = models.PositiveSmallIntegerField("Baho (0–5)")
    comment = models.TextField("Izoh", blank=True)
    at = models.DateTimeField("Vaqt", default=timezone.now)

    class Meta:
        verbose_name = "Baho"
        verbose_name_plural = "Baholar"
        ordering = ["-at"]

    def __str__(self):
        return f"{self.case} · {self.stars}"
