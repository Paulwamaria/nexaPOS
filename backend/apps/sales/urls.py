from django.urls import path

from .views import (
    CheckoutAPIView,
    SaleListAPIView,
    SaleDetailAPIView,
    CashShiftListAPIView,
    OpenCashShiftAPIView,
    CloseCashShiftAPIView,
    CurrentCashShiftAPIView,
    SaleReturnCreateAPIView,
    SaleReturnListAPIView,
)

urlpatterns = [
    path("", SaleListAPIView.as_view(), name="sale-list"),
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("<int:pk>/", SaleDetailAPIView.as_view(), name="sale-detail"),
    path("shifts/", CashShiftListAPIView.as_view(), name="cash-shift-list"),
    path("shifts/open/", OpenCashShiftAPIView.as_view(), name="cash-shift-open"),
    path(
        "shifts/<int:pk>/close/",
        CloseCashShiftAPIView.as_view(),
        name="cash-shift-close",
    ),
    path(
        "shifts/current/", CurrentCashShiftAPIView.as_view(), name="cash-shift-current"
    ),
    path("returns/", SaleReturnListAPIView.as_view(), name="sale-return-list"),
    path(
        "returns/create/", SaleReturnCreateAPIView.as_view(), name="sale-return-create"
    ),
]
