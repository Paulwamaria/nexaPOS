from django.urls import path

from .views import (
    CategoryListCreateAPIView,
    ProductListCreateAPIView,
    ProductDetailAPIView,
    BranchStockListAPIView,
    LowStockListAPIView,
    StockAdjustmentAPIView,
)

urlpatterns = [
    path(
        "categories/", CategoryListCreateAPIView.as_view(), name="category-list-create"
    ),
    path("products/", ProductListCreateAPIView.as_view(), name="product-list-create"),
    path("products/<int:pk>/", ProductDetailAPIView.as_view(), name="product-detail"),
    path("stocks/", BranchStockListAPIView.as_view(), name="stock-list"),
    path("low-stock/", LowStockListAPIView.as_view(), name="low-stock"),
    path("adjust-stock/", StockAdjustmentAPIView.as_view(), name="adjust-stock"),
]
