from django.urls import path

from .views import (
    SupplierListCreateAPIView,
    SupplierDetailAPIView,
    PurchaseOrderListCreateAPIView,
    PurchaseOrderDetailAPIView,
    ReceivePurchaseOrderAPIView,
)

urlpatterns = [
    path(
        "suppliers/", SupplierListCreateAPIView.as_view(), name="supplier-list-create"
    ),
    path(
        "suppliers/<int:pk>/", SupplierDetailAPIView.as_view(), name="supplier-detail"
    ),
    path(
        "purchase-orders/",
        PurchaseOrderListCreateAPIView.as_view(),
        name="purchase-order-list-create",
    ),
    path(
        "purchase-orders/<int:pk>/",
        PurchaseOrderDetailAPIView.as_view(),
        name="purchase-order-detail",
    ),
    path(
        "purchase-orders/<int:pk>/receive/",
        ReceivePurchaseOrderAPIView.as_view(),
        name="purchase-order-receive",
    ),
]
