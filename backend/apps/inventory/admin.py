from django.contrib import admin

from .models import (
    Category,
    Product,
    BranchStock,
    StockMovement,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "is_active",
        "created_at",
    )

    search_fields = ("name",)

    list_filter = ("is_active",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "category",
        "cost_price",
        "retail_price",
        "wholesale_price",
        "is_active",
    )

    search_fields = (
        "name",
        "sku",
        "barcode",
    )

    list_filter = (
        "category",
        "is_active",
    )


@admin.register(BranchStock)
class BranchStockAdmin(admin.ModelAdmin):
    list_display = (
        "branch",
        "product",
        "quantity",
        "reorder_level",
        "updated_at",
    )

    search_fields = (
        "product__name",
        "branch__name",
    )

    list_filter = ("branch",)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "branch",
        "movement_type",
        "quantity",
        "previous_quantity",
        "new_quantity",
        "created_by",
        "created_at",
    )

    search_fields = (
        "product__name",
        "branch__name",
    )

    list_filter = (
        "movement_type",
        "branch",
    )
