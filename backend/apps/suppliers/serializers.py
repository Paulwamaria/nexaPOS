from rest_framework import serializers

from apps.inventory.models import Product
from .models import Supplier, PurchaseOrder, PurchaseOrderItem


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "address",
            "contact_person",
            "is_active",
            "created_at",
        ]


class PurchaseOrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity_ordered = serializers.DecimalField(max_digits=12, decimal_places=2)
    cost_price = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value


class PurchaseOrderCreateSerializer(serializers.Serializer):
    supplier_id = serializers.IntegerField()
    branch_id = serializers.IntegerField()
    items = PurchaseOrderItemInputSerializer(many=True)


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product = serializers.CharField(source="product.name")

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id",
            "product",
            "quantity_ordered",
            "quantity_received",
            "cost_price",
            "total",
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier = serializers.CharField(source="supplier.name")
    branch = serializers.CharField(source="branch.name")
    created_by = serializers.CharField(source="created_by.full_name")
    received_by = serializers.SerializerMethodField()
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "order_number",
            "supplier",
            "branch",
            "status",
            "total_amount",
            "created_by",
            "received_by",
            "created_at",
            "received_at",
            "items",
        ]

    def get_received_by(self, obj):
        if obj.received_by:
            return obj.received_by.full_name
        return None
