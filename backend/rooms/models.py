"""Mediation rooms: a private chat between the mediator and each party, meetings, and agreement approvals."""

import uuid

from django.db import models
from django.utils import timezone

from cases.models import Case


class Party(models.TextChoices):
    CLAIMANT = "claimant", "Murojaatchi"
    RESPONDENT = "respondent", "Ikkinchi tomon"


class Message(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="messages")
    party = models.CharField("Suhbat", max_length=12, choices=Party.choices)  # which of the two private chats
    sender = models.CharField("Yuboruvchi", max_length=12)  # mediator | claimant | respondent
    text = models.TextField("Matn")
    created_at = models.DateTimeField(default=timezone.now)
    read_by_mediator = models.BooleanField(default=False)
    read_by_party = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Xabar"
        verbose_name_plural = "Xabarlar"


class Meeting(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Tasdiq kutilmoqda"
        ACCEPTED = "accepted", "Tasdiqlandi"
        DECLINED = "declined", "Rad etildi"
        CANCELLED = "cancelled", "Bekor qilindi"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="meetings")
    party = models.CharField("Tomon", max_length=12, choices=Party.choices)
    start = models.DateTimeField("Boshlanishi")
    minutes = models.PositiveSmallIntegerField("Davomiyligi (daqiqa)", default=45)
    mode = models.CharField("Shakl", max_length=10, default="online")  # online | ofis
    place = models.CharField("Joy yoki havola", max_length=200, blank=True)
    note = models.CharField("Izoh", max_length=300, blank=True)
    status = models.CharField("Holat", max_length=10, choices=Status.choices, default=Status.PROPOSED)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["start"]
        verbose_name = "Uchrashuv"
        verbose_name_plural = "Uchrashuvlar"

    @property
    def end(self):
        return self.start + timezone.timedelta(minutes=self.minutes)


class Approval(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="approvals")
    party = models.CharField("Tomon", max_length=12, choices=Party.choices)
    decision = models.CharField("Qaror", max_length=10)  # approved | changes
    comment = models.CharField("Izoh", max_length=500, blank=True)
    # Art. 29: the agreement must name each party in full and give a residence or postal address
    full_name = models.CharField("F.I.Sh. (toʻliq)", max_length=160, blank=True)
    address = models.CharField("Yashash joyi yoki pochta manzili", max_length=250, blank=True)
    agreement_hash = models.CharField(max_length=40)
    at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = [("case", "party")]
        verbose_name = "Kelishuv tasdigʻi"
        verbose_name_plural = "Kelishuv tasdiqlari"
