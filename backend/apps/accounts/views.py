from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrSuperAdmin
from apps.branches.models import Branch, UserBranch
from .serializers import (
    MeSerializer,
    UserListSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserBranchAssignSerializer,
)

User = get_user_model()


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)


class UserListCreateAPIView(ListCreateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserListSerializer


class UserDetailAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserUpdateSerializer
        return UserListSerializer


class AssignUserBranchesAPIView(APIView):
    permission_classes = [IsAdminOrSuperAdmin]

    def post(self, request):
        serializer = UserBranchAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        user = User.objects.get(id=data["user_id"])
        branch_ids = data["branch_ids"]
        default_branch_id = data.get("default_branch_id") or branch_ids[0]

        if default_branch_id not in branch_ids:
            return Response(
                {"detail": "Default branch must be inside branch_ids."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserBranch.objects.filter(user=user).delete()

        for branch_id in branch_ids:
            branch = Branch.objects.get(id=branch_id)
            UserBranch.objects.create(
                user=user,
                branch=branch,
                is_default=branch_id == default_branch_id,
            )

        return Response(
            {"detail": "User branches updated successfully."},
            status=status.HTTP_200_OK,
        )
