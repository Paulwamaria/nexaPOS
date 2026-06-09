from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.audit.models import AuditLog


class AuditLogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            email="admin-audit@test.com",
            password="password123",
            full_name="Audit Admin",
            role="ADMIN",
        )

        self.cashier = User.objects.create_user(
            email="cashier-audit@test.com",
            password="password123",
            full_name="Audit Cashier",
            role="CASHIER",
        )

        AuditLog.objects.create(
            user=self.admin,
            action=AuditLog.Action.USER_CREATED,
            entity_type="User",
            entity_id=self.cashier.id,
            description="Created cashier user.",
        )

    def test_admin_can_list_audit_logs(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/audit-logs/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_cashier_cannot_list_audit_logs(self):
        self.client.force_authenticate(user=self.cashier)

        response = self.client.get("/api/audit-logs/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_list_audit_logs(self):
        response = self.client.get("/api/audit-logs/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)