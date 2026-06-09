from django.urls import path

from .views import (
    DashboardReportAPIView,
    TopSellingProductsAPIView,
    SalesByBranchAPIView,
    ProfitByBranchAPIView,
    CashierPerformanceAPIView,
    ProcurementSummaryAPIView,
)

urlpatterns = [
    path("dashboard/", DashboardReportAPIView.as_view(), name="dashboard-report"),
    path(
        "top-selling-products/",
        TopSellingProductsAPIView.as_view(),
        name="top-selling-products",
    ),
    path(
        "sales-by-branch/",
        SalesByBranchAPIView.as_view(),
        name="sales-by-branch",
    ),
    path(
        "profit-by-branch/",
        ProfitByBranchAPIView.as_view(),
        name="profit-by-branch",
    ),
    path(
        "cashier-performance/",
        CashierPerformanceAPIView.as_view(),
        name="cashier-performance",
    ),
    path(
        "procurement-summary/",
        ProcurementSummaryAPIView.as_view(),
        name="procurement-summary",
    ),
]
