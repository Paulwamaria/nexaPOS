from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.branches.models import Branch
from apps.inventory.models import Product
from apps.sales.serializers import CheckoutSerializer, SaleResponseSerializer
from apps.sales.services import process_checkout


class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

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
