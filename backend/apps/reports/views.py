from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.models import Expense
from apps.accounts.permissions import IsAdminOrSuperAdmin
from django.db.models import Count, Sum, F
from rest_framework.response import Response

from apps.sales.models import Sale, SaleItem, Payment
from apps.inventory.models import BranchStock
from apps.suppliers.models import PurchaseOrder


class DashboardReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        today = timezone.localdate()

        todays_sales = Sale.objects.filter(
            created_at__date=today,
        )

        total_sales = todays_sales.aggregate(total=Sum("total_amount"))["total"] or 0

        total_expenses = (
            Expense.objects.filter(
                expense_date=today,
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        gross_profit = (
            SaleItem.objects.filter(
                sale__created_at__date=today,
            ).aggregate(
                total=Sum(F("total") - (F("cost_price") * F("quantity")))
            )["total"]
            or 0
        )

        low_stock_count = BranchStock.objects.filter(
            quantity__lte=F("reorder_level")
        ).count()

        return Response(
            {
                "date": today,
                "total_sales": total_sales,
                "total_expenses": total_expenses,
                "gross_profit": gross_profit,
                "net_profit_estimate": gross_profit - total_expenses,
                "sales_count": todays_sales.count(),
                "low_stock_count": low_stock_count,
            }
        )


class TopSellingProductsAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        data = (
            SaleItem.objects.values("product__id", "product__name")
            .annotate(
                total_quantity=Sum("quantity"),
                total_sales=Sum("total"),
            )
            .order_by("-total_quantity")[:10]
        )

        return Response(data)


class SalesByBranchAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        data = (
            Sale.objects.values("branch__id", "branch__name")
            .annotate(
                sales_count=Count("id"),
                total_sales=Sum("total_amount"),
            )
            .order_by("-total_sales")
        )

        return Response(data)


class ProfitByBranchAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        data = (
            SaleItem.objects.values("sale__branch__id", "sale__branch__name")
            .annotate(
                gross_profit=Sum(F("total") - (F("cost_price") * F("quantity"))),
                total_sales=Sum("total"),
            )
            .order_by("-gross_profit")
        )

        return Response(data)


class CashierPerformanceAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        data = (
            Sale.objects.values("cashier__id", "cashier__full_name", "cashier__email")
            .annotate(
                sales_count=Count("id"),
                total_sales=Sum("total_amount"),
            )
            .order_by("-total_sales")
        )

        return Response(data)


class ProcurementSummaryAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        data = (
            PurchaseOrder.objects.values(
                "branch__id", "branch__name", "supplier__name", "status"
            )
            .annotate(
                order_count=Count("id"),
                total_amount=Sum("total_amount"),
            )
            .order_by("branch__name", "supplier__name")
        )

        return Response(data)
