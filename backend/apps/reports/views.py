from django.db.models import Count, F, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrSuperAdmin
from apps.expenses.models import Expense
from apps.inventory.models import BranchStock
from apps.sales.models import Sale, SaleItem
from apps.suppliers.models import PurchaseOrder


def apply_date_filters(queryset, request, date_field):
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    if start_date:
        queryset = queryset.filter(**{f"{date_field}__date__gte": start_date})

    if end_date:
        queryset = queryset.filter(**{f"{date_field}__date__lte": end_date})

    return queryset


def apply_branch_filter(queryset, request, branch_field="branch_id"):
    branch_id = request.query_params.get("branch_id")

    if branch_id:
        queryset = queryset.filter(**{branch_field: branch_id})

    return queryset


class DashboardReportAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        branch_id = request.query_params.get("branch_id")

        todays_sales = Sale.objects.filter(created_at__date=today)
        todays_expenses = Expense.objects.filter(expense_date=today)
        sale_items = SaleItem.objects.filter(sale__created_at__date=today)

        if branch_id:
            todays_sales = todays_sales.filter(branch_id=branch_id)
            todays_expenses = todays_expenses.filter(branch_id=branch_id)
            sale_items = sale_items.filter(sale__branch_id=branch_id)

        total_sales = todays_sales.aggregate(total=Sum("total_amount"))["total"] or 0

        total_expenses = todays_expenses.aggregate(total=Sum("amount"))["total"] or 0

        gross_profit = (
            sale_items.aggregate(
                total=Sum(F("total") - (F("cost_price") * F("quantity")))
            )["total"]
            or 0
        )

        low_stock_queryset = BranchStock.objects.filter(
            quantity__lte=F("reorder_level")
        )

        if branch_id:
            low_stock_queryset = low_stock_queryset.filter(branch_id=branch_id)

        return Response(
            {
                "date": today,
                "branch_id": branch_id,
                "total_sales": total_sales,
                "total_expenses": total_expenses,
                "gross_profit": gross_profit,
                "net_profit_estimate": gross_profit - total_expenses,
                "sales_count": todays_sales.count(),
                "low_stock_count": low_stock_queryset.count(),
            }
        )


class TopSellingProductsAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get(self, request):
        queryset = SaleItem.objects.select_related("sale", "product")
        queryset = apply_date_filters(queryset, request, "sale__created_at")
        queryset = apply_branch_filter(queryset, request, "sale__branch_id")

        data = (
            queryset.values("product__id", "product__name")
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
        queryset = Sale.objects.all()
        queryset = apply_date_filters(queryset, request, "created_at")
        queryset = apply_branch_filter(queryset, request, "branch_id")

        data = (
            queryset.values("branch__id", "branch__name")
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
        queryset = SaleItem.objects.select_related("sale", "sale__branch", "product")
        queryset = apply_date_filters(queryset, request, "sale__created_at")
        queryset = apply_branch_filter(queryset, request, "sale__branch_id")

        data = (
            queryset.values("sale__branch__id", "sale__branch__name")
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
        queryset = Sale.objects.select_related("cashier", "branch")
        queryset = apply_date_filters(queryset, request, "created_at")
        queryset = apply_branch_filter(queryset, request, "branch_id")

        data = (
            queryset.values(
                "cashier__id",
                "cashier__full_name",
                "cashier__email",
            )
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
        queryset = PurchaseOrder.objects.select_related("branch", "supplier")
        queryset = apply_date_filters(queryset, request, "created_at")
        queryset = apply_branch_filter(queryset, request, "branch_id")

        data = (
            queryset.values(
                "branch__id",
                "branch__name",
                "supplier__name",
                "status",
            )
            .annotate(
                order_count=Count("id"),
                total_amount=Sum("total_amount"),
            )
            .order_by("branch__name", "supplier__name")
        )

        return Response(data)
