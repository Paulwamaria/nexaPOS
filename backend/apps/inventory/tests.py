from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.inventory.models import BranchStock, Category, Product, StockMovement


class InventoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.branch = Branch.objects.create(
            name="Main Branch",
            code="MAIN",
        )

        self.storekeeper = User.objects.create_user(
            email="store-api@test.com",
            password="password123",
            full_name="API Storekeeper",
            role="STORE_KEEPER",
        )

        self.cashier = User.objects.create_user(
            email="cashier-inventory@test.com",
            password="password123",
            full_name="Inventory Cashier",
            role="CASHIER",
        )

        self.category = Category.objects.create(name="Food")

        self.product = Product.objects.create(
            category=self.category,
            name="Sugar 2KG",
            sku="INV-SKU001",
            cost_price=Decimal("240.00"),
            retail_price=Decimal("320.00"),
            wholesale_price=Decimal("290.00"),
        )

        self.stock = BranchStock.objects.create(
            branch=self.branch,
            product=self.product,
            quantity=Decimal("10.00"),
            reorder_level=5,
        )

    def test_storekeeper_can_adjust_stock_in(self):
        self.client.force_authenticate(user=self.storekeeper)

        response = self.client.post(
            "/api/inventory/adjust-stock/",
            {
                "branch_id": self.branch.id,
                "product_id": self.product.id,
                "quantity": "5.00",
                "adjustment_type": "ADJUSTMENT_IN",
                "notes": "Restock test",
            },
            format="json",
        )

        self.stock.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.stock.quantity, Decimal("15.00"))
        self.assertEqual(StockMovement.objects.count(), 1)

    def test_storekeeper_can_adjust_stock_out(self):
        self.client.force_authenticate(user=self.storekeeper)

        response = self.client.post(
            "/api/inventory/adjust-stock/",
            {
                "branch_id": self.branch.id,
                "product_id": self.product.id,
                "quantity": "3.00",
                "adjustment_type": "ADJUSTMENT_OUT",
                "notes": "Damaged items",
            },
            format="json",
        )

        self.stock.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.stock.quantity, Decimal("7.00"))
        self.assertEqual(StockMovement.objects.count(), 1)

    def test_adjust_stock_blocks_insufficient_stock_out(self):
        self.client.force_authenticate(user=self.storekeeper)

        response = self.client.post(
            "/api/inventory/adjust-stock/",
            {
                "branch_id": self.branch.id,
                "product_id": self.product.id,
                "quantity": "100.00",
                "adjustment_type": "ADJUSTMENT_OUT",
                "notes": "Invalid adjustment",
            },
            format="json",
        )

        self.stock.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.stock.quantity, Decimal("10.00"))

    def test_cashier_cannot_adjust_stock(self):
        self.client.force_authenticate(user=self.cashier)

        response = self.client.post(
            "/api/inventory/adjust-stock/",
            {
                "branch_id": self.branch.id,
                "product_id": self.product.id,
                "quantity": "5.00",
                "adjustment_type": "ADJUSTMENT_IN",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_adjust_stock(self):
        response = self.client.post(
            "/api/inventory/adjust-stock/",
            {
                "branch_id": self.branch.id,
                "product_id": self.product.id,
                "quantity": "5.00",
                "adjustment_type": "ADJUSTMENT_IN",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
