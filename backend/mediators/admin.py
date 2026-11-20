from django.contrib import admin

from .models import Mediator


@admin.register(Mediator)
class MediatorAdmin(admin.ModelAdmin):
    list_display = ["name", "region", "rating", "sessions", "price_uzs"]
    list_filter = ["region"]
    search_fields = ["name", "registry_no"]
