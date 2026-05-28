from rest_framework import serializers

from apps.branches.models import Branch
from apps.inventory.models import Product
from apps.sales.models import Sale


class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)


class CheckoutPaymentSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=["CASH", "MPESA", "CARD"])
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    reference = serializers.CharField(required=False, allow_blank=True)


class CheckoutSerializer(serializers.Serializer):
    branch_id = serializers.IntegerField()
    sale_type = serializers.ChoiceField(choices=["RETAIL", "WHOLESALE"])
    items = CheckoutItemSerializer(many=True)
    payments = CheckoutPaymentSerializer(many=True)

    def validate_branch_id(self, value):
        if not Branch.objects.filter(id=value).exists():
            raise serializers.ValidationError("Branch does not exist.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")

        for item in value:
            if not Product.objects.filter(id=item["product_id"]).exists():
                raise serializers.ValidationError(
                    f"Product {item['product_id']} does not exist."
                )

        return value


class SaleItemResponseSerializer(serializers.Serializer):
    product = serializers.CharField(source="product.name")
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


class SaleResponseSerializer(serializers.ModelSerializer):
    items = SaleItemResponseSerializer(many=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "sale_number",
            "sale_type",
            "subtotal",
            "total_amount",
            "created_at",
            "items",
        ]
