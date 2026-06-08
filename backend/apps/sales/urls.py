from django.urls import path

from .views import (
    CheckoutAPIView,
    SaleListAPIView,
    SaleDetailAPIView,
    CashShiftListAPIView,
    OpenCashShiftAPIView,
    CloseCashShiftAPIView,
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
]
