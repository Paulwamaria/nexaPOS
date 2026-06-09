from rest_framework.generics import ListAPIView

from apps.accounts.permissions import IsAdminOrSuperAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListAPIView(ListAPIView):
    permission_classes = [IsAdminOrSuperAdmin]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.select_related(
            "user",
            "branch",
        ).order_by("-created_at")

        action = self.request.query_params.get("action")
        branch_id = self.request.query_params.get("branch_id")
        user_id = self.request.query_params.get("user_id")

        if action:
            queryset = queryset.filter(action=action)

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset
