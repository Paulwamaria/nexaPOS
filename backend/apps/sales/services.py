from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from apps.inventory.models import BranchStock, StockMovement
from apps.sales.models import (
    Sale,
    SaleItem,
    Payment,
    CashShift,
    SaleReturn,
    SaleReturnItem,
)


def generate_sale_number():
    today = timezone.now().strftime("%Y%m%d")
    count = Sale.objects.filter(created_at__date=timezone.now().date()).count() + 1
    return f"SALE-{today}-{count:04d}"


@transaction.atomic
def process_checkout(
    *, branch, cashier, customer=None, sale_type="RETAIL", items=None, payments=None
):
    if not items:
        raise ValueError("Sale must have at least one item.")

    if not payments:
        raise ValueError("Sale must have at least one payment.")

    subtotal = Decimal("0.00")

    open_shift = CashShift.objects.filter(
        branch=branch,
        cashier=cashier,
        status="OPEN",
    ).first()

    if not open_shift:
        raise ValueError("You must open a cash shift before processing sales.")

    sale = Sale.objects.create(
        sale_number=generate_sale_number(),
        branch=branch,
        cashier=cashier,
        customer=customer,
        cash_shift=open_shift,
        sale_type=sale_type,
        subtotal=0,
        total_amount=0,
    )

    for item in items:
        product = item["product"]
        quantity = Decimal(str(item["quantity"]))

        stock = BranchStock.objects.select_for_update().get(
            branch=branch,
            product=product,
        )

        if stock.quantity < quantity:
            raise ValueError(f"Insufficient stock for {product.name}")

        unit_price = (
            product.wholesale_price
            if sale_type == "WHOLESALE"
            else product.retail_price
        )

        line_total = unit_price * quantity
        subtotal += line_total

        previous_quantity = stock.quantity
        stock.quantity -= quantity
        stock.save()

        SaleItem.objects.create(
            sale=sale,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
            cost_price=product.cost_price,
            total=line_total,
        )

        StockMovement.objects.create(
            branch=branch,
            product=product,
            movement_type="SALE",
            quantity=quantity,
            previous_quantity=previous_quantity,
            new_quantity=stock.quantity,
            created_by=cashier,
            notes=f"Sale {sale.sale_number}",
        )

    sale.subtotal = subtotal
    sale.total_amount = subtotal
    sale.save()

    total_paid = Decimal("0.00")

    for payment in payments:
        total_paid += Decimal(str(payment["amount"]))

    if total_paid < sale.total_amount:
        raise ValueError(
            f"Amount paid is less than sale total. Total: {sale.total_amount}, Paid: {total_paid}"
        )

    for payment in payments:
        amount = Decimal(str(payment["amount"]))
        total_paid += amount

        Payment.objects.create(
            sale=sale,
            amount=amount,
            payment_method=payment["payment_method"],
            reference=payment.get("reference", ""),
            received_by=cashier,
        )

    return sale


@transaction.atomic
def process_sale_return(*, sale, returned_by, reason="", items=None):
    if not items:
        raise ValueError("Return must have at least one item.")

    sale_return = SaleReturn.objects.create(
        sale=sale,
        branch=sale.branch,
        returned_by=returned_by,
        reason=reason,
        total_refund_amount=0,
    )

    total_refund = Decimal("0.00")

    for item in items:
        sale_item = item["sale_item"]
        quantity = Decimal(str(item["quantity"]))
        restock = item.get("restock", True)

        if sale_item.sale_id != sale.id:
            raise ValueError("Returned item does not belong to this sale.")

        if quantity <= 0:
            raise ValueError("Return quantity must be greater than zero.")

        if quantity > sale_item.quantity:
            raise ValueError(
                f"Cannot return more than sold quantity for {sale_item.product.name}."
            )

        refund_amount = sale_item.unit_price * quantity
        total_refund += refund_amount

        SaleReturnItem.objects.create(
            sale_return=sale_return,
            sale_item=sale_item,
            product=sale_item.product,
            quantity=quantity,
            refund_amount=refund_amount,
            restock=restock,
        )

        if restock:
            stock, _ = BranchStock.objects.select_for_update().get_or_create(
                branch=sale.branch,
                product=sale_item.product,
                defaults={
                    "quantity": 0,
                    "reorder_level": 5,
                },
            )

            previous_quantity = stock.quantity
            stock.quantity += quantity
            stock.save()

            StockMovement.objects.create(
                branch=sale.branch,
                product=sale_item.product,
                movement_type="SALE_RETURN",
                quantity=quantity,
                previous_quantity=previous_quantity,
                new_quantity=stock.quantity,
                created_by=returned_by,
                notes=f"Return for {sale.sale_number}",
            )

    sale_return.total_refund_amount = total_refund
    sale_return.save()

    return sale_return
