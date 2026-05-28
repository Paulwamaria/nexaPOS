from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ("email",)

    list_display = (
        "email",
        "full_name",
        "phone",
        "role",
        "is_active",
        "is_staff",
    )

    search_fields = (
        "email",
        "full_name",
        "phone",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
    )

    fieldsets = (
        (
            "Authentication",
            {
                "fields": (
                    "email",
                    "password",
                )
            },
        ),
        (
            "Personal Information",
            {
                "fields": (
                    "full_name",
                    "phone",
                    "role",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Important Dates",
            {
                "fields": (
                    "last_login",
                    "date_joined",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "phone",
                    "role",
                    "password1",
                    "password2",
                ),
            },
        ),
    )
