import csv

from django.http import HttpResponse

from apps.audit.models import AuditLog
from apps.inventory.models import BranchStock
from apps.sales.models import Sale
from apps.suppliers.models import PurchaseOrder


def csv_response(filename):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def export_sales_csv(request):
    response = csv_response("sales_export.csv")
    writer = csv.writer(response)

    writer.writerow(
        [
            "Sale Number",
            "Branch",
            "Cashier",
            "Sale Type",
            "Total Amount",
            "Created At",
        ]
    )

    sales = Sale.objects.select_related("branch", "cashier").order_by("-created_at")

    for sale in sales:
        writer.writerow(
            [
                sale.sale_number,
                sale.branch.name,
                sale.cashier.full_name if sale.cashier else "",
                sale.sale_type,
                sale.total_amount,
                sale.created_at,
            ]
        )

    return response


def export_inventory_csv(request):
    response = csv_response("inventory_export.csv")
    writer = csv.writer(response)

    writer.writerow(
        [
            "Branch",
            "Product",
            "SKU",
            "Quantity",
            "Reorder Level",
        ]
    )

    stocks = BranchStock.objects.select_related(
        "branch",
        "product",
    ).order_by("branch__name", "product__name")

    for stock in stocks:
        writer.writerow(
            [
                stock.branch.name,
                stock.product.name,
                stock.product.sku,
                stock.quantity,
                stock.reorder_level,
            ]
        )

    return response


def export_audit_logs_csv(request):
    response = csv_response("audit_logs_export.csv")
    writer = csv.writer(response)

    writer.writerow(
        [
            "Action",
            "User",
            "Branch",
            "Entity Type",
            "Entity ID",
            "Description",
            "Created At",
        ]
    )

    logs = AuditLog.objects.select_related("user", "branch").order_by("-created_at")

    for log in logs:
        writer.writerow(
            [
                log.action,
                log.user.email if log.user else "",
                log.branch.name if log.branch else "",
                log.entity_type,
                log.entity_id,
                log.description,
                log.created_at,
            ]
        )

    return response


def export_procurement_csv(request):
    response = csv_response("procurement_export.csv")
    writer = csv.writer(response)

    writer.writerow(
        [
            "Order Number",
            "Supplier",
            "Branch",
            "Status",
            "Total Amount",
            "Created By",
            "Received By",
            "Created At",
            "Received At",
        ]
    )

    orders = PurchaseOrder.objects.select_related(
        "supplier",
        "branch",
        "created_by",
        "received_by",
    ).order_by("-created_at")

    for order in orders:
        writer.writerow(
            [
                order.order_number,
                order.supplier.name,
                order.branch.name,
                order.status,
                order.total_amount,
                order.created_by.full_name if order.created_by else "",
                order.received_by.full_name if order.received_by else "",
                order.created_at,
                order.received_at or "",
            ]
        )

    return response
