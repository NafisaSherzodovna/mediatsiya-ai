from django.conf import settings
from django.db import models


class Role(models.TextChoices):
    CLAIMANT = "claimant", "Murojaatchi"
    MEDIATOR = "mediator", "Mediator"
    MINISTRY = "ministry", "Vazirlik"
    ADMIN = "admin", "Administrator"


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField("Rol", max_length=16, choices=Role.choices, default=Role.CLAIMANT)
    full_name = models.CharField("F.I.Sh.", max_length=120)
    phone = models.CharField("Telefon", max_length=20, blank=True)

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profillar"

    def __str__(self):
        return self.full_name
