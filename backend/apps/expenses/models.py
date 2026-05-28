from django.conf import settings
from django.db import models

from apps.branches.models import Branch


class ExpenseCategory(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Expense(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
    )

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    description = models.TextField(blank=True)

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )

    expense_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
