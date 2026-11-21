from django.contrib import admin

from .models import Case, CaseEvent, Review


class CaseEventInline(admin.TabularInline):
    model = CaseEvent
    extra = 0


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ["code", "status", "dispute_type", "region", "amount_uzs", "mediator", "created_at"]
    list_filter = ["status", "dispute_type", "region"]
    search_fields = ["code", "respondent_name", "description"]
    readonly_fields = ["invite_token"]
    inlines = [CaseEventInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["case", "stars", "at"]
    list_filter = ["stars"]
