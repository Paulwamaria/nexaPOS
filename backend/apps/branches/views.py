from django.shortcuts import render

# Create your views here.
from rest_framework.generics import ListCreateAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsAdminOrSuperAdmin
from .models import Branch, UserBranch
from .serializers import BranchSerializer, UserBranchSerializer


class BranchListCreateAPIView(ListCreateAPIView):
    serializer_class = BranchSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminOrSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Branch.objects.filter(is_active=True).order_by("name")


class MyBranchesAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserBranchSerializer

    def get_queryset(self):
        return UserBranch.objects.select_related("branch").filter(
            user=self.request.user,
            branch__is_active=True,
        )
