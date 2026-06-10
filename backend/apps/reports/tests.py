from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.inventory.models import BranchStock, Category, Product
from apps.sales.models import CashShift
from apps.sales.services import process_checkout


class ReportsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            email="reports-admin@test.com",
            password="password123",
            full_name="Reports Admin",
            role="ADMIN",
        )

        self.cashier = User.objects.create_user(
            email="reports-cashier@test.com",
            password="password123",
            full_name="Reports Cashier",
            role="CASHIER",
        )

        self.branch = Branch.objects.create(
            name="Main Branch",
            code="MAIN",
        )

        self.category = Category.objects.create(name="Food")

        self.product = Product.objects.create(
            category=self.category,
            name="Sugar 2KG",
            sku="REPORT-SKU001",
            cost_price=Decimal("240.00"),
            retail_price=Decimal("320.00"),
            wholesale_price=Decimal("290.00"),
        )

        BranchStock.objects.create(
            branch=self.branch,
            product=self.product,
            quantity=Decimal("20.00"),
            reorder_level=5,
        )

        CashShift.objects.create(
            branch=self.branch,
            cashier=self.cashier,
            opening_cash=Decimal("1000.00"),
        )

        process_checkout(
            branch=self.branch,
            cashier=self.cashier,
            sale_type="RETAIL",
            items=[
                {
                    "product": self.product,
                    "quantity": Decimal("2.00"),
                }
            ],
            payments=[
                {
                    "payment_method": "CASH",
                    "amount": Decimal("640.00"),
                }
            ],
        )

    def test_admin_can_view_dashboard_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/reports/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_sales"], Decimal("640.00"))
        self.assertEqual(response.data["sales_count"], 1)

    def test_cashier_cannot_view_dashboard_report(self):
        self.client.force_authenticate(user=self.cashier)

        response = self.client.get("/api/reports/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_top_selling_products_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/reports/top-selling-products/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["product__name"], "Sugar 2KG")
        self.assertEqual(response.data[0]["total_quantity"], Decimal("2.00"))

    def test_sales_by_branch_report(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/reports/sales-by-branch/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["branch__name"], "Main Branch")
        self.assertEqual(response.data[0]["total_sales"], Decimal("640.00"))

    def test_branch_filter_on_dashboard(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            f"/api/reports/dashboard/?branch_id={self.branch.id}"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["branch_id"], str(self.branch.id))
        self.assertEqual(response.data["total_sales"], Decimal("640.00"))
