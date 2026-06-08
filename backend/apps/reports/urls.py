from django.urls import path

from .views import DashboardReportAPIView

urlpatterns = [
    path("dashboard/", DashboardReportAPIView.as_view(), name="dashboard-report"),
]
