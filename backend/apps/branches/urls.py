from django.urls import path

from .views import BranchListCreateAPIView, MyBranchesAPIView

urlpatterns = [
    path("", BranchListCreateAPIView.as_view(), name="branch-list-create"),
    path("mine/", MyBranchesAPIView.as_view(), name="my-branches"),
]
