from django.urls import path

from .views import (
    ExpenseCategoryListCreateAPIView,
    ExpenseListCreateAPIView,
)

urlpatterns = [
    path("", ExpenseListCreateAPIView.as_view(), name="expense-list-create"),
    path(
        "categories/",
        ExpenseCategoryListCreateAPIView.as_view(),
        name="expense-category-list-create",
    ),
]
