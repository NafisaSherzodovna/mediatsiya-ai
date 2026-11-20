from django.contrib import admin

from .models import Approval, Meeting, Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("case", "party", "sender", "text", "created_at")
    list_filter = ("party", "sender")


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("case", "party", "start", "minutes", "mode", "status")
    list_filter = ("status", "party")


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ("case", "party", "decision", "at")
