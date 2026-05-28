from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from apps.inventory.models import BranchStock, StockMovement
from apps.sales.models import Sale, SaleItem, Payment


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

    sale = Sale.objects.create(
        sale_number=generate_sale_number(),
        branch=branch,
        cashier=cashier,
        customer=customer,
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
