from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "action",
        "entity_type",
        "entity_id",
        "user",
        "branch",
        "created_at",
    )
    search_fields = (
        "action",
        "entity_type",
        "entity_id",
        "description",
        "user__email",
    )
    list_filter = (
        "action",
        "branch",
        "created_at",
    )
    readonly_fields = (
        "user",
        "branch",
        "action",
        "entity_type",
        "entity_id",
        "description",
        "metadata",
        "ip_address",
        "created_at",
    )
