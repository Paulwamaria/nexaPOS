from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminOrSuperAdmin, IsStoreKeeperOrAdmin

from .models import ExpenseCategory, Expense
from .serializers import (
    ExpenseCategorySerializer,
    ExpenseSerializer,
    ExpenseCreateSerializer,
)


class ExpenseCategoryListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    serializer_class = ExpenseCategorySerializer
    queryset = ExpenseCategory.objects.all().order_by("name")


class ExpenseListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get_queryset(self):
        return Expense.objects.select_related(
            "branch",
            "category",
            "recorded_by",
        ).order_by("-expense_date", "-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
