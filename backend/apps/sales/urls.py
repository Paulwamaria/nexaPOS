from django.urls import path

from .views import (
    CheckoutAPIView,
    SaleListAPIView,
    SaleDetailAPIView,
)


urlpatterns = [
    path("", SaleListAPIView.as_view(), name="sale-list"),
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("<int:pk>/", SaleDetailAPIView.as_view(), name="sale-detail"),
]