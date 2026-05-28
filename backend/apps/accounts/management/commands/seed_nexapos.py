from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.branches.models import Branch, UserBranch
from apps.inventory.models import (
    Category,
    Product,
    BranchStock,
    StockMovement,
)
from apps.expenses.models import (
    ExpenseCategory,
    Expense,
)


class Command(BaseCommand):
    help = "Seed NexaPOS dummy data"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Seeding NexaPOS data..."))

        # -------------------
        # Branches
        # -------------------

        main_branch, _ = Branch.objects.get_or_create(
            code="MAIN",
            defaults={
                "name": "Main Branch",
                "location": "Nairobi CBD",
                "phone": "0712345678",
            },
        )

        westlands_branch, _ = Branch.objects.get_or_create(
            code="WEST",
            defaults={
                "name": "Westlands Branch",
                "location": "Westlands",
                "phone": "0799999999",
            },
        )

        # -------------------
        # Users
        # -------------------

        admin_user, _ = User.objects.get_or_create(
            email="admin@nexapos.com",
            defaults={
                "full_name": "System Admin",
                "role": "ADMIN",
            },
        )
        admin_user.set_password("password123")
        admin_user.save()

        cashier, _ = User.objects.get_or_create(
            email="cashier@nexapos.com",
            defaults={
                "full_name": "Jane Cashier",
                "role": "CASHIER",
            },
        )
        cashier.set_password("password123")
        cashier.save()

        store_keeper, _ = User.objects.get_or_create(
            email="store@nexapos.com",
            defaults={
                "full_name": "John Storekeeper",
                "role": "STORE_KEEPER",
            },
        )
        store_keeper.set_password("password123")
        store_keeper.save()

        # -------------------
        # Branch Assignment
        # -------------------

        UserBranch.objects.get_or_create(
            user=admin_user,
            branch=main_branch,
            defaults={"is_default": True},
        )

        UserBranch.objects.get_or_create(
            user=cashier,
            branch=main_branch,
            defaults={"is_default": True},
        )

        UserBranch.objects.get_or_create(
            user=store_keeper,
            branch=main_branch,
            defaults={"is_default": True},
        )

        # -------------------
        # Categories
        # -------------------

        food = Category.objects.get_or_create(name="Food")[0]
        drinks = Category.objects.get_or_create(name="Drinks")[0]
        electronics = Category.objects.get_or_create(name="Electronics")[0]

        # -------------------
        # Products
        # -------------------

        products = [
            {
                "name": "Sugar 2KG",
                "sku": "SKU001",
                "category": food,
                "cost": 240,
                "retail": 320,
                "wholesale": 290,
            },
            {
                "name": "Milk 500ml",
                "sku": "SKU002",
                "category": drinks,
                "cost": 45,
                "retail": 65,
                "wholesale": 55,
            },
            {
                "name": "Bread Large",
                "sku": "SKU003",
                "category": food,
                "cost": 45,
                "retail": 70,
                "wholesale": 60,
            },
            {
                "name": "Cooking Oil 1L",
                "sku": "SKU004",
                "category": food,
                "cost": 210,
                "retail": 290,
                "wholesale": 260,
            },
            {
                "name": "Bluetooth Speaker",
                "sku": "SKU005",
                "category": electronics,
                "cost": 2200,
                "retail": 3500,
                "wholesale": 3000,
            },
        ]

        for item in products:
            product, created = Product.objects.get_or_create(
                sku=item["sku"],
                defaults={
                    "name": item["name"],
                    "category": item["category"],
                    "cost_price": Decimal(item["cost"]),
                    "retail_price": Decimal(item["retail"]),
                    "wholesale_price": Decimal(item["wholesale"]),
                },
            )

            stock, _ = BranchStock.objects.get_or_create(
                branch=main_branch,
                product=product,
                defaults={
                    "quantity": 100,
                    "reorder_level": 10,
                },
            )

            StockMovement.objects.get_or_create(
                branch=main_branch,
                product=product,
                movement_type="PURCHASE",
                quantity=100,
                previous_quantity=0,
                new_quantity=100,
                created_by=admin_user,
                notes="Initial stock seed",
            )

        # -------------------
        # Expense Categories
        # -------------------

        rent = ExpenseCategory.objects.get_or_create(name="Rent")[0]

        transport = ExpenseCategory.objects.get_or_create(name="Transport")[0]

        # -------------------
        # Expenses
        # -------------------

        Expense.objects.get_or_create(
            branch=main_branch,
            category=rent,
            amount=50000,
            description="Monthly rent",
            recorded_by=admin_user,
            expense_date="2026-05-28",
        )

        Expense.objects.get_or_create(
            branch=main_branch,
            category=transport,
            amount=5000,
            description="Stock transport",
            recorded_by=admin_user,
            expense_date="2026-05-28",
        )

        self.stdout.write(
            self.style.SUCCESS("NexaPOS dummy data created successfully!")
        )
