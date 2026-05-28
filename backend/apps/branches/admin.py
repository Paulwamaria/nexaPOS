from django.contrib import admin

from .models import Branch, UserBranch


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "phone",
        "location",
        "is_active",
    )

    search_fields = (
        "name",
        "code",
        "phone",
        "location",
    )

    list_filter = ("is_active",)


@admin.register(UserBranch)
class UserBranchAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "branch",
        "is_default",
    )

    search_fields = (
        "user__email",
        "user__full_name",
        "branch__name",
    )

    list_filter = (
        "branch",
        "is_default",
    )
