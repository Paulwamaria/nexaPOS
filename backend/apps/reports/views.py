from django.db.models import Sum, F
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.models import Expense
from apps.inventory.models import BranchStock
from apps.sales.models import Sale, SaleItem


class DashboardReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

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
