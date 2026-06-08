from django.urls import path

from .views import (
    ProductListAPIView,
    BranchStockListAPIView,
    LowStockListAPIView,
    StockAdjustmentAPIView,
)

urlpatterns = [
    path("products/", ProductListAPIView.as_view(), name="product-list"),
    path("stocks/", BranchStockListAPIView.as_view(), name="stock-list"),
    path("low-stock/", LowStockListAPIView.as_view(), name="low-stock"),
    path("adjust-stock/", StockAdjustmentAPIView.as_view(), name="adjust-stock"),
]
