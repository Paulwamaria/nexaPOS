from django.urls import path

from .views import (
    DashboardReportAPIView,
    TopSellingProductsAPIView,
    SalesByBranchAPIView,
    ProfitByBranchAPIView,
    CashierPerformanceAPIView,
    ProcurementSummaryAPIView,
    SalesCSVExportAPIView,
    InventoryCSVExportAPIView,
    AuditLogsCSVExportAPIView,
    ProcurementCSVExportAPIView,
    DashboardAttentionAPIView,
    DashboardSummaryAPIView,
    DashboardActivityAPIView,
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
    path("exports/sales.csv", SalesCSVExportAPIView.as_view(), name="export-sales-csv"),
    path(
        "exports/inventory.csv",
        InventoryCSVExportAPIView.as_view(),
        name="export-inventory-csv",
    ),
    path(
        "exports/audit-logs.csv",
        AuditLogsCSVExportAPIView.as_view(),
        name="export-audit-logs-csv",
    ),
    path(
        "exports/procurement.csv",
        ProcurementCSVExportAPIView.as_view(),
        name="export-procurement-csv",
    ),
    path(
        "dashboard/attention/",
        DashboardAttentionAPIView.as_view(),
        name="dashboard-attention",
    ),
    path(
        "dashboard/summary/",
        DashboardSummaryAPIView.as_view(),
        name="dashboard-summary",
    ),
    path(
        "dashboard/activity/",
        DashboardActivityAPIView.as_view(),
        name="dashboard-activity",
    ),
]
