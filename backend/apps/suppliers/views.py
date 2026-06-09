from rest_framework import status
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsStoreKeeperOrAdmin
from apps.branches.models import Branch
from apps.inventory.models import Product
from .models import Supplier, PurchaseOrder
from .serializers import (
    SupplierSerializer,
    PurchaseOrderCreateSerializer,
    PurchaseOrderSerializer,
)
from .services import create_purchase_order, receive_purchase_order


class SupplierListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]
    serializer_class = SupplierSerializer

    def get_queryset(self):
        return Supplier.objects.all().order_by("name")


class SupplierDetailAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()


class PurchaseOrderListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]

    def get_queryset(self):
        return (
            PurchaseOrder.objects.select_related(
                "supplier", "branch", "created_by", "received_by"
            )
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = PurchaseOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        supplier = Supplier.objects.get(id=data["supplier_id"])
        branch = Branch.objects.get(id=data["branch_id"])

        items = []
        for item in data["items"]:
            product = Product.objects.get(id=item["product_id"])
            items.append(
                {
                    "product": product,
                    "quantity_ordered": item["quantity_ordered"],
                    "cost_price": item["cost_price"],
                }
            )

        try:
            purchase_order = create_purchase_order(
                supplier=supplier,
                branch=branch,
                created_by=request.user,
                items=items,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            PurchaseOrderSerializer(purchase_order).data,
            status=status.HTTP_201_CREATED,
        )


class PurchaseOrderDetailAPIView(RetrieveAPIView):
    permission_classes = [IsStoreKeeperOrAdmin]
    serializer_class = PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.select_related(
        "supplier", "branch", "created_by", "received_by"
    ).prefetch_related("items__product")


class ReceivePurchaseOrderAPIView(APIView):
    permission_classes = [IsStoreKeeperOrAdmin]

    def post(self, request, pk):
        try:
            purchase_order = PurchaseOrder.objects.get(id=pk)
            purchase_order = receive_purchase_order(
                purchase_order=purchase_order,
                received_by=request.user,
            )
        except PurchaseOrder.DoesNotExist:
            return Response(
                {"detail": "Purchase order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(PurchaseOrderSerializer(purchase_order).data)
