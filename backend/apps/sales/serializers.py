from rest_framework import serializers

from apps.branches.models import Branch
from apps.inventory.models import Product
from apps.sales.models import (
    Sale,
    SaleItem,
    Payment,
    CashShift,
    SaleReturn,
    SaleReturnItem,
    Customer
)


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


class SaleItemResponseSerializer(serializers.ModelSerializer):
    product = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "quantity",
            "unit_price",
            "total",
        ]


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


class PaymentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "payment_method",
            "amount",
            "reference",
            "created_at",
        ]


class SaleListSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source="branch.name")
    cashier = serializers.CharField(source="cashier.full_name")

    class Meta:
        model = Sale
        fields = [
            "id",
            "sale_number",
            "branch",
            "cashier",
            "sale_type",
            "subtotal",
            "total_amount",
            "created_at",
        ]


class SaleDetailSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source="branch.name", read_only=True)
    cashier = serializers.CharField(source="cashier.full_name", read_only=True)
    customer = serializers.SerializerMethodField()
    items = SaleItemResponseSerializer(many=True, read_only=True)
    payments = PaymentResponseSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "sale_number",
            "branch",
            "cashier",
            "customer",
            "sale_type",
            "subtotal",
            "total_amount",
            "created_at",
            "items",
            "payments",
        ]

    def get_customer(self, obj):
        if obj.customer:
            return obj.customer.name
        return None


class CashShiftSerializer(serializers.ModelSerializer):
    branch = serializers.CharField(source="branch.name", read_only=True)
    cashier = serializers.CharField(source="cashier.full_name", read_only=True)

    class Meta:
        model = CashShift
        fields = [
            "id",
            "branch",
            "cashier",
            "opening_cash",
            "closing_cash",
            "status",
            "expected_cash",
            "difference",
            "opened_at",
            "closed_at",
        ]


class CashShiftOpenSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashShift
        fields = [
            "branch",
            "opening_cash",
        ]


class CashShiftCloseSerializer(serializers.Serializer):
    closing_cash = serializers.DecimalField(max_digits=12, decimal_places=2)


class SaleReturnItemInputSerializer(serializers.Serializer):
    sale_item_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    restock = serializers.BooleanField(default=True)


class SaleReturnCreateSerializer(serializers.Serializer):
    sale_id = serializers.IntegerField()
    reason = serializers.CharField(required=False, allow_blank=True)
    receipt_verified = serializers.BooleanField(default=True)
    items = SaleReturnItemInputSerializer(many=True)


class SaleReturnItemResponseSerializer(serializers.ModelSerializer):
    product = serializers.CharField(source="product.name")

    class Meta:
        model = SaleReturnItem
        fields = [
            "id",
            "product",
            "quantity",
            "refund_amount",
            "restock",
        ]


class SaleReturnResponseSerializer(serializers.ModelSerializer):
    sale_number = serializers.CharField(source="sale.sale_number")
    returned_by = serializers.CharField(source="returned_by.full_name")
    items = SaleReturnItemResponseSerializer(many=True)

    class Meta:
        model = SaleReturn
        fields = [
            "id",
            "sale_number",
            "reason",
            "total_refund_amount",
            "returned_by",
            "created_at",
            "items",
            "receipt_verified",
            "refund_risk_level",
            "risk_notes",
            "manager_reviewed",
        ]


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "customer_type",
        ]
