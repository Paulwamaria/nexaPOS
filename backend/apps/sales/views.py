from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from apps.sales.models import Sale, SaleReturn
from apps.audit.models import AuditLog
from apps.audit.services import create_audit_log
from apps.sales.models import Customer
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
    SaleReturnCreateSerializer,
    SaleReturnResponseSerializer,
    CustomerSerializer,
)
from apps.sales.services import process_checkout, process_sale_return
from rest_framework.generics import ListAPIView, RetrieveAPIView, ListCreateAPIView
from apps.sales.models import Sale, CashShift, SaleReturn, SaleItem
from apps.accounts.permissions import IsCashierOrAdmin, IsAdminOrSuperAdmin


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

        create_audit_log(
            user=request.user,
            branch=shift.branch,
            action=AuditLog.Action.SHIFT_OPENED,
            entity_type="CashShift",
            entity_id=shift.id,
            description=f"Cash shift opened by {request.user.email}.",
            metadata={
                "opening_cash": str(shift.opening_cash),
            },
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
        cash_sales = shift.sales.filter(
            payments__payment_method="CASH",
        ).distinct().aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

        cash_refunds = SaleReturn.objects.filter(
            sale__cash_shift=shift,
        ).aggregate(
            total=Sum("total_refund_amount")
        )["total"] or Decimal("0.00")

        closing_cash = serializer.validated_data["closing_cash"]

        expected_cash = shift.opening_cash + cash_sales - cash_refunds
        difference = closing_cash - expected_cash

        shift.closing_cash = closing_cash
        shift.expected_cash = expected_cash
        shift.difference = difference
        shift.status = "CLOSED"
        shift.closed_at = timezone.now()
        shift.save()

        create_audit_log(
            user=request.user,
            branch=shift.branch,
            action=AuditLog.Action.SHIFT_CLOSED,
            entity_type="CashShift",
            entity_id=shift.id,
            description=f"Cash shift closed by {request.user.email}.",
            metadata={
                "opening_cash": str(shift.opening_cash),
                "closing_cash": str(shift.closing_cash),
                "expected_cash": str(shift.expected_cash),
                "difference": str(shift.difference),
            },
        )
        return Response(CashShiftSerializer(shift).data)


class CurrentCashShiftAPIView(APIView):
    permission_classes = [IsCashierOrAdmin]

    def get(self, request):
        branch_id = request.query_params.get("branch_id")

        queryset = CashShift.objects.select_related(
            "branch",
            "cashier",
        ).filter(
            cashier=request.user,
            status="OPEN",
        )

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        shift = queryset.order_by("-opened_at").first()

        if not shift:
            return Response(
                {"detail": "No open shift found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(CashShiftSerializer(shift).data)


class SaleReturnCreateAPIView(APIView):
    permission_classes = [IsCashierOrAdmin]

    def post(self, request):
        serializer = SaleReturnCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        sale = get_object_or_404(Sale, id=data["sale_id"])
        receipt_verified = (data.get("receipt_verified", True),)

        items = []
        for item in data["items"]:
            sale_item = get_object_or_404(
                SaleItem,
                id=item["sale_item_id"],
            )
            items.append(
                {
                    "sale_item": sale_item,
                    "quantity": item["quantity"],
                    "restock": item.get("restock", True),
                }
            )

        try:
            sale_return = process_sale_return(
                sale=sale,
                returned_by=request.user,
                reason=data.get("reason", ""),
                receipt_verified=data.get("receipt_verified", True),
                items=items,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            SaleReturnResponseSerializer(sale_return).data,
            status=status.HTTP_201_CREATED,
        )


class SaleReturnListAPIView(ListAPIView):
    permission_classes = [IsCashierOrAdmin]
    serializer_class = SaleReturnResponseSerializer

    def get_queryset(self):
        return (
            SaleReturn.objects.select_related("sale", "returned_by")
            .prefetch_related("items__product")
            .order_by("-created_at")
        )


class SaleReturnReviewAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request, pk):
        sale_return = get_object_or_404(SaleReturn, id=pk)

        sale_return.manager_reviewed = True
        sale_return.manager_reviewed_by = request.user
        sale_return.manager_reviewed_at = timezone.now()
        sale_return.save()

        return Response(SaleReturnResponseSerializer(sale_return).data)


class CustomerListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerSerializer

    def get_queryset(self):
        return Customer.objects.all().order_by("name")
