from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["full_name", "role", "user", "phone"]
    list_filter = ["role"]
    search_fields = ["full_name", "phone", "user__username"]


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = "Profil (rol, F.I.Sh., telefon)"


# The site stores role, full name and phone on Profile: show them on the user page and in the list.
admin.site.unregister(User)


@admin.register(User)
class UserWithProfileAdmin(UserAdmin):
    inlines = [ProfileInline]
    list_display = ["username", "last_name", "first_name", "phone", "role", "is_staff"]
    search_fields = ["username", "first_name", "last_name", "email", "profile__phone", "profile__full_name"]

    @admin.display(description="Telefon")
    def phone(self, user):
        return getattr(getattr(user, "profile", None), "phone", "")

    @admin.display(description="Rol")
    def role(self, user):
        p = getattr(user, "profile", None)
        return p.get_role_display() if p else ""
