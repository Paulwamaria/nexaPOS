from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/sales/", include("apps.sales.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path("api/expenses/", include("apps.expenses.urls")),
]
