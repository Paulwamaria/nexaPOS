from django.conf import settings
from django.db import models

from apps.branches.models import Branch


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    class Unit(models.TextChoices):
        PIECE = "PIECE", "Piece"
        KG = "KG", "Kilogram"
        LITRE = "LITRE", "Litre"
        BOX = "BOX", "Box"
        CARTON = "CARTON", "Carton"
        PACKET = "PACKET", "Packet"

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products",
    )

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=255, blank=True)

    description = models.TextField(blank=True)

    unit = models.CharField(
        max_length=50,
        choices=Unit.choices,
        default=Unit.PIECE,
    )

    cost_price = models.DecimalField(max_digits=12, decimal_places=2)

    retail_price = models.DecimalField(max_digits=12, decimal_places=2)

    wholesale_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    wholesale_min_quantity = models.PositiveIntegerField(default=10)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class BranchStock(models.Model):
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="stocks",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="branch_stocks",
    )

    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    reorder_level = models.PositiveIntegerField(default=5)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("branch", "product")

    def __str__(self):
        return f"{self.branch.name} - {self.product.name}"


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        PURCHASE = "PURCHASE", "Purchase"
        SALE = "SALE", "Sale"
        ADJUSTMENT_IN = "ADJUSTMENT_IN", "Adjustment In"
        ADJUSTMENT_OUT = "ADJUSTMENT_OUT", "Adjustment Out"

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
    )

    movement_type = models.CharField(
        max_length=50,
        choices=MovementType.choices,
    )

    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    previous_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    new_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.movement_type}"
