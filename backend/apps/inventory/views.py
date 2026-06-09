from django.db import models, transaction
from django.db import transaction
from rest_framework import status
from apps.audit.models import AuditLog
from apps.audit.services import create_audit_log
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsStoreKeeperOrAdmin

from apps.branches.models import Branch
from .models import Product, BranchStock, StockMovement
from .serializers import (
    ProductSerializer,
    BranchStockSerializer,
    StockAdjustmentSerializer,
    CategorySerializer,
    ProductCreateUpdateSerializer,
)


class ProductListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.select_related("category").filter(is_active=True)


class BranchStockListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BranchStockSerializer

    def get_queryset(self):
        return BranchStock.objects.select_related(
            "branch",
            "product",
            "product__category",
        )


class LowStockListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BranchStockSerializer

    def get_queryset(self):
        return BranchStock.objects.select_related(
            "branch",
            "product",
            "product__category",
        ).filter(quantity__lte=models.F("reorder_level"))


class StockAdjustmentAPIView(APIView):
    permission_classes = [IsAuthenticated, IsStoreKeeperOrAdmin]

    @transaction.atomic
    def post(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        branch = Branch.objects.get(id=data["branch_id"])
        product = Product.objects.get(id=data["product_id"])
        quantity = data["quantity"]
        adjustment_type = data["adjustment_type"]

        stock, _ = BranchStock.objects.select_for_update().get_or_create(
            branch=branch,
            product=product,
            defaults={
                "quantity": 0,
                "reorder_level": 5,
            },
        )

        previous_quantity = stock.quantity

        if adjustment_type == "ADJUSTMENT_IN":
            stock.quantity += quantity
        else:
            if stock.quantity < quantity:
                return Response(
                    {"detail": "Insufficient stock for adjustment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            stock.quantity -= quantity

        stock.save()

        StockMovement.objects.create(
            branch=branch,
            product=product,
            movement_type=adjustment_type,
            quantity=quantity,
            previous_quantity=previous_quantity,
            new_quantity=stock.quantity,
            created_by=request.user,
            notes=data.get("notes", ""),
        )

        create_audit_log(
            user=request.user,
            branch=branch,
            action=AuditLog.Action.STOCK_ADJUSTED,
            entity_type="StockMovement",
            entity_id=movement.id,
            description=f"{adjustment_type} for {product.name}.",
            metadata={
                "product_id": product.id,
                "product_name": product.name,
                "quantity": str(quantity),
                "previous_quantity": str(previous_quantity),
                "new_quantity": str(stock.quantity),
            },
        )
        return Response(
            {
                "detail": "Stock adjusted successfully.",
                "previous_quantity": previous_quantity,
                "new_quantity": stock.quantity,
            },
            status=status.HTTP_200_OK,
        )


class CategoryListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.all().order_by("name")


class ProductListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]

    def get_queryset(self):
        return Product.objects.select_related("category").order_by("name")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductCreateUpdateSerializer
        return ProductSerializer


class ProductDetailAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]
    queryset = Product.objects.select_related("category").all()

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProductCreateUpdateSerializer
        return ProductSerializer
