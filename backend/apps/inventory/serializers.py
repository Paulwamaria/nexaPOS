from rest_framework import serializers

from .models import Product, BranchStock, StockMovement, Category


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "barcode",
            "category",
            "unit",
            "cost_price",
            "retail_price",
            "wholesale_price",
            "wholesale_min_quantity",
            "is_active",
        ]


class BranchStockSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source="branch.name")
    product = ProductSerializer()

    class Meta:
        model = BranchStock
        fields = [
            "id",
            "branch",
            "product",
            "quantity",
            "reorder_level",
            "updated_at",
        ]


class StockAdjustmentSerializer(serializers.Serializer):
    branch_id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    adjustment_type = serializers.ChoiceField(
        choices=["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "name",
            "sku",
            "barcode",
            "description",
            "unit",
            "cost_price",
            "retail_price",
            "wholesale_price",
            "wholesale_min_quantity",
            "is_active",
        ]
