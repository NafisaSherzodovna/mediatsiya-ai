from django.contrib import admin

from .models import Mediator


@admin.register(Mediator)
class MediatorAdmin(admin.ModelAdmin):
    list_display = ["name", "registry_no", "registry_date", "region", "rating", "reviews", "resolved", "price_uzs", "approved", "removed_at"]
    list_editable = ["approved"]
    list_filter = ["approved", "region"]
    search_fields = ["name", "registry_no"]
