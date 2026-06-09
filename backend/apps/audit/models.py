from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models

from apps.branches.models import Branch


class AuditLog(models.Model):
    class Action(models.TextChoices):
        USER_CREATED = "USER_CREATED", "User Created"
        USER_UPDATED = "USER_UPDATED", "User Updated"
        USER_BRANCHES_ASSIGNED = "USER_BRANCHES_ASSIGNED", "User Branches Assigned"

        BRANCH_CREATED = "BRANCH_CREATED", "Branch Created"

        PRODUCT_CREATED = "PRODUCT_CREATED", "Product Created"
        PRODUCT_UPDATED = "PRODUCT_UPDATED", "Product Updated"

        STOCK_ADJUSTED = "STOCK_ADJUSTED", "Stock Adjusted"

        SALE_CREATED = "SALE_CREATED", "Sale Created"
        SALE_RETURNED = "SALE_RETURNED", "Sale Returned"

        EXPENSE_CREATED = "EXPENSE_CREATED", "Expense Created"

        SHIFT_OPENED = "SHIFT_OPENED", "Shift Opened"
        SHIFT_CLOSED = "SHIFT_CLOSED", "Shift Closed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    action = models.CharField(
        max_length=80,
        choices=Action.choices,
    )

    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, blank=True)

    description = models.TextField(blank=True)

    metadata = models.JSONField(default=dict, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.entity_type} #{self.entity_id}"
