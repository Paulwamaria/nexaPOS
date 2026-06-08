from rest_framework import serializers

from .models import ExpenseCategory, Expense


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = [
            "id",
            "name",
        ]


class ExpenseSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source="branch.name", read_only=True)
    category = serializers.CharField(source="category.name", read_only=True)
    recorded_by = serializers.CharField(source="recorded_by.full_name", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "branch",
            "category",
            "amount",
            "description",
            "recorded_by",
            "expense_date",
            "created_at",
        ]


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "branch",
            "category",
            "amount",
            "description",
            "expense_date",
        ]
