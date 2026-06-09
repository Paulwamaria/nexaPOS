from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.audit.models import AuditLog
from apps.audit.services import create_audit_log
from apps.inventory.models import BranchStock, StockMovement
from .models import PurchaseOrder, PurchaseOrderItem


def generate_purchase_order_number():
    today = timezone.now().strftime("%Y%m%d")
    count = (
        PurchaseOrder.objects.filter(created_at__date=timezone.now().date()).count() + 1
    )
    return f"PO-{today}-{count:04d}"


@transaction.atomic
def create_purchase_order(*, supplier, branch, created_by, items):
    if not items:
        raise ValueError("Purchase order must have at least one item.")

    purchase_order = PurchaseOrder.objects.create(
        supplier=supplier,
        branch=branch,
        order_number=generate_purchase_order_number(),
        created_by=created_by,
        total_amount=0,
    )

    total_amount = Decimal("0.00")

    for item in items:
        product = item["product"]
        quantity = Decimal(str(item["quantity_ordered"]))
        cost_price = Decimal(str(item["cost_price"]))
        line_total = quantity * cost_price

        PurchaseOrderItem.objects.create(
            purchase_order=purchase_order,
            product=product,
            quantity_ordered=quantity,
            cost_price=cost_price,
            total=line_total,
        )

        total_amount += line_total

    purchase_order.total_amount = total_amount
    purchase_order.save()

    create_audit_log(
        user=created_by,
        branch=branch,
        action=AuditLog.Action.PURCHASE_ORDER_CREATED,
        entity_type="PurchaseOrder",
        entity_id=purchase_order.id,
        description=f"Purchase order {purchase_order.order_number} created.",
        metadata={
            "order_number": purchase_order.order_number,
            "supplier": supplier.name,
            "total_amount": str(total_amount),
            "items_count": purchase_order.items.count(),
        },
    )

    return purchase_order


@transaction.atomic
def receive_purchase_order(*, purchase_order, received_by):
    if purchase_order.status == PurchaseOrder.Status.RECEIVED:
        raise ValueError("Purchase order has already been received.")

    for item in purchase_order.items.select_related("product"):
        stock, _ = BranchStock.objects.select_for_update().get_or_create(
            branch=purchase_order.branch,
            product=item.product,
            defaults={
                "quantity": 0,
                "reorder_level": 5,
            },
        )

        previous_quantity = stock.quantity
        stock.quantity += item.quantity_ordered
        stock.save()

        item.quantity_received = item.quantity_ordered
        item.save()

        StockMovement.objects.create(
            branch=purchase_order.branch,
            product=item.product,
            movement_type="PURCHASE_RECEIVED",
            quantity=item.quantity_ordered,
            previous_quantity=previous_quantity,
            new_quantity=stock.quantity,
            created_by=received_by,
            notes=f"Received from PO {purchase_order.order_number}",
        )

    purchase_order.status = PurchaseOrder.Status.RECEIVED
    purchase_order.received_by = received_by
    purchase_order.received_at = timezone.now()
    purchase_order.save()

    create_audit_log(
        user=received_by,
        branch=purchase_order.branch,
        action=AuditLog.Action.PURCHASE_ORDER_RECEIVED,
        entity_type="PurchaseOrder",
        entity_id=purchase_order.id,
        description=f"Purchase order {purchase_order.order_number} received.",
        metadata={
            "order_number": purchase_order.order_number,
            "supplier": purchase_order.supplier.name,
            "total_amount": str(purchase_order.total_amount),
        },
    )

    return purchase_order
