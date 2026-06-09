from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.inventory.models import BranchStock, Category, Product
from apps.sales.models import CashShift, Payment, Sale, SaleItem
from apps.sales.services import process_checkout
from rest_framework.test import APIClient
from rest_framework import status


class CheckoutServiceTests(TestCase):
    def setUp(self):
        self.branch = Branch.objects.create(
            name="Main Branch",
            code="MAIN",
        )

        self.cashier = User.objects.create_user(
            email="cashier@test.com",
            password="password123",
            full_name="Test Cashier",
            role="CASHIER",
        )

        self.category = Category.objects.create(name="Food")

        self.product = Product.objects.create(
            category=self.category,
            name="Sugar 2KG",
            sku="SKU001",
            cost_price=Decimal("240.00"),
            retail_price=Decimal("320.00"),
            wholesale_price=Decimal("290.00"),
            wholesale_min_quantity=10,
        )

        self.stock = BranchStock.objects.create(
            branch=self.branch,
            product=self.product,
            quantity=Decimal("20.00"),
            reorder_level=5,
        )

    def open_shift(self):
        return CashShift.objects.create(
            branch=self.branch,
            cashier=self.cashier,
            opening_cash=Decimal("1000.00"),
        )

    def test_checkout_deducts_stock_and_records_payment(self):
        self.open_shift()

        sale = process_checkout(
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

        self.stock.refresh_from_db()

        self.assertEqual(sale.total_amount, Decimal("640.00"))
        self.assertEqual(self.stock.quantity, Decimal("18.00"))
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(SaleItem.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)

    def test_checkout_requires_open_shift(self):
        with self.assertRaisesMessage(
            ValueError,
            "You must open a cash shift before processing sales.",
        ):
            process_checkout(
                branch=self.branch,
                cashier=self.cashier,
                sale_type="RETAIL",
                items=[
                    {
                        "product": self.product,
                        "quantity": Decimal("1.00"),
                    }
                ],
                payments=[
                    {
                        "payment_method": "CASH",
                        "amount": Decimal("320.00"),
                    }
                ],
            )

    def test_checkout_blocks_insufficient_stock(self):
        self.open_shift()

        with self.assertRaisesMessage(
            ValueError,
            "Insufficient stock for Sugar 2KG",
        ):
            process_checkout(
                branch=self.branch,
                cashier=self.cashier,
                sale_type="RETAIL",
                items=[
                    {
                        "product": self.product,
                        "quantity": Decimal("100.00"),
                    }
                ],
                payments=[
                    {
                        "payment_method": "CASH",
                        "amount": Decimal("32000.00"),
                    }
                ],
            )

    def test_checkout_blocks_insufficient_payment(self):
        self.open_shift()

        with self.assertRaisesMessage(
            ValueError,
            "Amount paid is less than sale total.",
        ):
            process_checkout(
                branch=self.branch,
                cashier=self.cashier,
                sale_type="RETAIL",
                items=[
                    {
                        "product": self.product,
                        "quantity": Decimal("1.00"),
                    }
                ],
                payments=[
                    {
                        "payment_method": "CASH",
                        "amount": Decimal("100.00"),
                    }
                ],
            )

    def test_wholesale_sale_uses_wholesale_price(self):
        self.open_shift()

        sale = process_checkout(
            branch=self.branch,
            cashier=self.cashier,
            sale_type="WHOLESALE",
            items=[
                {
                    "product": self.product,
                    "quantity": Decimal("10.00"),
                }
            ],
            payments=[
                {
                    "payment_method": "CASH",
                    "amount": Decimal("2900.00"),
                }
            ],
        )

        item = sale.items.first()

        self.assertEqual(item.unit_price, Decimal("290.00"))
        self.assertEqual(sale.total_amount, Decimal("2900.00"))


class SalesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.branch = Branch.objects.create(
            name="Main Branch",
            code="MAIN",
        )

        self.cashier = User.objects.create_user(
            email="cashier-api@test.com",
            password="password123",
            full_name="API Cashier",
            role="CASHIER",
        )

        self.category = Category.objects.create(name="Food")

        self.product = Product.objects.create(
            category=self.category,
            name="Sugar 2KG",
            sku="API-SKU001",
            cost_price=Decimal("240.00"),
            retail_price=Decimal("320.00"),
            wholesale_price=Decimal("290.00"),
            wholesale_min_quantity=10,
        )

        self.stock = BranchStock.objects.create(
            branch=self.branch,
            product=self.product,
            quantity=Decimal("20.00"),
            reorder_level=5,
        )

    def authenticate_cashier(self):
        self.client.force_authenticate(user=self.cashier)

    def test_open_shift_api(self):
        self.authenticate_cashier()

        response = self.client.post(
            "/api/sales/shifts/open/",
            {
                "branch": self.branch.id,
                "opening_cash": "1000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "OPEN")

    def test_checkout_api_requires_authentication(self):
        response = self.client.post(
            "/api/sales/checkout/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_checkout_api_creates_sale_and_deducts_stock(self):
        self.authenticate_cashier()

        self.client.post(
            "/api/sales/shifts/open/",
            {
                "branch": self.branch.id,
                "opening_cash": "1000.00",
            },
            format="json",
        )

        response = self.client.post(
            "/api/sales/checkout/",
            {
                "branch_id": self.branch.id,
                "sale_type": "RETAIL",
                "items": [
                    {
                        "product_id": self.product.id,
                        "quantity": "2.00",
                    }
                ],
                "payments": [
                    {
                        "payment_method": "CASH",
                        "amount": "640.00",
                    }
                ],
            },
            format="json",
        )

        self.stock.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_amount"], "640.00")
        self.assertEqual(self.stock.quantity, Decimal("18.00"))

    def test_checkout_api_blocks_without_open_shift(self):
        self.authenticate_cashier()

        response = self.client.post(
            "/api/sales/checkout/",
            {
                "branch_id": self.branch.id,
                "sale_type": "RETAIL",
                "items": [
                    {
                        "product_id": self.product.id,
                        "quantity": "1.00",
                    }
                ],
                "payments": [
                    {
                        "payment_method": "CASH",
                        "amount": "320.00",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("open a cash shift", response.data["detail"])
