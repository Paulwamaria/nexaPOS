from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum

from apps.branches.models import Branch
from apps.inventory.models import Product
from apps.sales.serializers import (
    CheckoutSerializer,
    SaleResponseSerializer,
    SaleListSerializer,
    SaleDetailSerializer,
    CashShiftSerializer,
    CashShiftOpenSerializer,
    CashShiftCloseSerializer,
)
from apps.sales.services import process_checkout
from rest_framework.generics import ListAPIView, RetrieveAPIView
from apps.sales.models import Sale, CashShift
from apps.accounts.permissions import IsCashierOrAdmin


class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated, IsCashierOrAdmin]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        branch = Branch.objects.get(id=data["branch_id"])

        items = []
        for item in data["items"]:
            product = Product.objects.get(id=item["product_id"])
            items.append(
                {
                    "product": product,
                    "quantity": item["quantity"],
                }
            )

        try:
            sale = process_checkout(
                branch=branch,
                cashier=request.user,
                sale_type=data["sale_type"],
                items=items,
                payments=data["payments"],
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = SaleResponseSerializer(sale)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class SaleListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SaleListSerializer

    def get_queryset(self):
        return Sale.objects.select_related("branch", "cashier", "customer").order_by(
            "-created_at"
        )


class SaleDetailAPIView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SaleDetailSerializer
    queryset = Sale.objects.select_related(
        "branch",
        "cashier",
        "customer",
    ).prefetch_related(
        "items__product",
        "payments",
    )


class CashShiftListAPIView(ListAPIView):
    permission_classes = [IsCashierOrAdmin]
    serializer_class = CashShiftSerializer

    def get_queryset(self):
        return CashShift.objects.select_related(
            "branch",
            "cashier",
        ).order_by("-opened_at")


class OpenCashShiftAPIView(APIView):
    permission_classes = [IsCashierOrAdmin]

    def post(self, request):
        serializer = CashShiftOpenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        branch = serializer.validated_data["branch"]

        existing_shift = CashShift.objects.filter(
            cashier=request.user,
            branch=branch,
            status="OPEN",
        ).first()

        if existing_shift:
            return Response(
                {"detail": "You already have an open shift for this branch."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shift = CashShift.objects.create(
            branch=branch,
            cashier=request.user,
            opening_cash=serializer.validated_data["opening_cash"],
        )

        return Response(
            CashShiftSerializer(shift).data,
            status=status.HTTP_201_CREATED,
        )


class CloseCashShiftAPIView(APIView):
    permission_classes = [IsCashierOrAdmin]

    def post(self, request, pk):
        serializer = CashShiftCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shift = get_object_or_404(CashShift, id=pk)

        if shift.cashier != request.user and request.user.role not in [
            "ADMIN",
            "SUPERADMIN",
        ]:
            return Response(
                {"detail": "You cannot close another cashier's shift."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if shift.status == "CLOSED":
            return Response(
                {"detail": "Shift is already closed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cash_sales = (
            shift.sales.filter(payments__payment_method="CASH").aggregate(
                total=Sum("payments__amount")
            )["total"]
            or 0
        )

        closing_cash = serializer.validated_data["closing_cash"]

        expected_cash = shift.opening_cash + cash_sales
        difference = closing_cash - expected_cash

        shift.closing_cash = closing_cash
        shift.expected_cash = expected_cash
        shift.difference = difference
        shift.status = "CLOSED"
        shift.closed_at = timezone.now()
        shift.save()

        return Response(CashShiftSerializer(shift).data)
