from django.db import models, transaction
from django.db import transaction
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.branches.models import Branch
from .models import Product, BranchStock, StockMovement
from .serializers import (
    ProductSerializer,
    BranchStockSerializer,
    StockAdjustmentSerializer,
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
    permission_classes = [IsAuthenticated]

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

        return Response(
            {
                "detail": "Stock adjusted successfully.",
                "previous_quantity": previous_quantity,
                "new_quantity": stock.quantity,
            },
            status=status.HTTP_200_OK,
        )
