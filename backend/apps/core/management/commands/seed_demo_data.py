# apps/core/management/commands/seed_demo_data.py

from decimal import Decimal
from random import choice, randint, sample

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.branches.models import Branch
from apps.inventory.models import Category, Product, BranchStock, StockMovement
from apps.sales.models import Customer, CashShift, Sale, SaleItem, Payment, SaleReturn
from apps.suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem


class Command(BaseCommand):
    help = "Seed NexaPOS demo data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo data before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("Resetting demo data...")

            SaleReturn.objects.all().delete()
            Payment.objects.all().delete()
            SaleItem.objects.all().delete()
            Sale.objects.all().delete()
            CashShift.objects.all().delete()
            PurchaseOrderItem.objects.all().delete()
            PurchaseOrder.objects.all().delete()
            StockMovement.objects.all().delete()
            BranchStock.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Supplier.objects.all().delete()
            Customer.objects.all().delete()

        self.stdout.write("Creating demo users...")

        admin, _ = User.objects.get_or_create(
            email="admin@nexapos.com",
            defaults={
                "full_name": "Nexa Admin",
                "role": "ADMIN",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("password123")
        admin.save()

        cashier, _ = User.objects.get_or_create(
            email="cashier@nexapos.com",
            defaults={
                "full_name": "Mary Cashier",
                "role": "CASHIER",
            },
        )
        cashier.set_password("password123")
        cashier.save()

        storekeeper, _ = User.objects.get_or_create(
            email="store@nexapos.com",
            defaults={
                "full_name": "Peter Storekeeper",
                "role": "STORE_KEEPER",
            },
        )
        storekeeper.set_password("password123")
        storekeeper.save()

        branches = []
        for name, code in [
            ("Main Branch", "MAIN"),
            ("CBD Branch", "CBD"),
            ("Westlands Branch", "WEST"),
        ]:
            branch, _ = Branch.objects.get_or_create(
                code=code,
                defaults={"name": name},
            )
            branches.append(branch)

        category_names = [
            "Beverages",
            "Bakery",
            "Dairy",
            "Household",
            "Electronics",
            "Stationery",
            "Snacks",
            "Cosmetics",
        ]

        categories = {
            name: Category.objects.get_or_create(name=name)[0]
            for name in category_names
        }

        product_data = [
            ("Brookside Milk 500ml", "DAI001", "Dairy", 45, 65, 60),
            ("Brookside Milk 1L", "DAI002", "Dairy", 85, 120, 110),
            ("Bread Large", "BAK001", "Bakery", 45, 70, 60),
            ("Bread Small", "BAK002", "Bakery", 30, 50, 45),
            ("Sugar 2KG", "HOU001", "Household", 240, 320, 290),
            ("Cooking Oil 1L", "HOU002", "Household", 220, 290, 270),
            ("Cooking Oil 3L", "HOU003", "Household", 620, 780, 740),
            ("Coca Cola 500ml", "BEV001", "Beverages", 45, 70, 65),
            ("Fanta Orange 500ml", "BEV002", "Beverages", 45, 70, 65),
            ("Bottled Water 500ml", "BEV003", "Beverages", 25, 50, 45),
            ("Exercise Book 200pg", "STA001", "Stationery", 55, 90, 80),
            ("Ball Pen Blue", "STA002", "Stationery", 10, 20, 15),
            ("Pencil HB", "STA003", "Stationery", 8, 15, 12),
            ("Omo 1KG", "HOU004", "Household", 230, 300, 280),
            ("Toilet Tissue 10 Pack", "HOU005", "Household", 260, 350, 330),
            ("Chocolate Bar", "SNA001", "Snacks", 45, 80, 70),
            ("Biscuits Pack", "SNA002", "Snacks", 35, 60, 55),
            ("Potato Crisps", "SNA003", "Snacks", 40, 70, 65),
            ("Body Lotion 400ml", "COS001", "Cosmetics", 250, 400, 370),
            ("Toothpaste 100ml", "COS002", "Cosmetics", 100, 160, 145),
            ("Bluetooth Speaker", "ELE001", "Electronics", 2500, 3500, 3200),
            ("Earphones", "ELE002", "Electronics", 350, 600, 550),
        ]

        products = []

        for name, sku, category, cost, retail, wholesale in product_data:
            product, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "category": categories[category],
                    "name": name,
                    "cost_price": Decimal(str(cost)),
                    "retail_price": Decimal(str(retail)),
                    "wholesale_price": Decimal(str(wholesale)),
                    "wholesale_min_quantity": 10,
                    "is_active": True,
                },
            )
            products.append(product)

        self.stdout.write("Creating branch stock...")

        for branch in branches:
            for product in products:
                quantity = Decimal(str(randint(5, 120)))

                if product.sku in ["DAI001", "BAK001", "HOU001", "BEV003"]:
                    quantity = Decimal(str(randint(1, 4)))

                BranchStock.objects.get_or_create(
                    branch=branch,
                    product=product,
                    defaults={
                        "quantity": quantity,
                        "reorder_level": 5,
                    },
                )

        suppliers = []
        for name in [
            "Brookside Distributors",
            "Bidco Kenya",
            "Unga Limited",
            "Text Book Centre",
            "Cosmetics Kenya Ltd",
            "Nairobi Electronics Supplies",
        ]:
            supplier, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={
                    "phone": "0712345678",
                    "email": f"{name.lower().replace(' ', '')}@demo.com",
                    "address": "Nairobi, Kenya",
                    "contact_person": "Demo Contact",
                },
            )
            suppliers.append(supplier)

        for name, phone in [
            ("Walk-in Customer", ""),
            ("John Mwangi", "0711000001"),
            ("Mary Wanjiku", "0711000002"),
            ("Peter Kamau", "0711000003"),
            ("Jane Njeri", "0711000004"),
        ]:
            Customer.objects.get_or_create(
                name=name,
                defaults={
                    "phone": phone,
                    "customer_type": "RETAIL",
                },
            )

        self.stdout.write("Creating demo purchase orders...")

        for i in range(6):
            supplier = choice(suppliers)
            branch = choice(branches)

            po, created = PurchaseOrder.objects.get_or_create(
                order_number=f"PO-DEMO-{i + 1:04d}",
                defaults={
                    "supplier": supplier,
                    "branch": branch,
                    "status": "RECEIVED",
                    "created_by": storekeeper,
                    "received_by": storekeeper,
                    "received_at": timezone.now(),
                    "total_amount": Decimal("0.00"),
                },
            )

            if created:
                total = Decimal("0.00")

                for product in sample(products, 3):
                    qty = Decimal(str(randint(10, 40)))
                    line_total = qty * product.cost_price

                    PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        product=product,
                        quantity_ordered=qty,
                        quantity_received=qty,
                        cost_price=product.cost_price,
                        total=line_total,
                    )

                    total += line_total

                po.total_amount = total
                po.save()

        self.stdout.write("Creating demo shifts and sales...")

        for i in range(10):
            branch = choice(branches)
            opening_cash = Decimal(str(randint(1000, 5000)))

            shift = CashShift.objects.create(
                branch=branch,
                cashier=cashier,
                opening_cash=opening_cash,
                closing_cash=opening_cash,
                expected_cash=opening_cash,
                difference=Decimal("0.00"),
                status="CLOSED",
                opened_at=timezone.now(),
                closed_at=timezone.now(),
            )

            shift_sales_total = Decimal("0.00")

            for j in range(randint(4, 10)):
                selected_products = sample(products, randint(1, 4))
                sale_total = Decimal("0.00")

                sale = Sale.objects.create(
                    branch=branch,
                    cashier=cashier,
                    customer=None,
                    sale_number=f"SALE-DEMO-{i + 1:02d}-{j + 1:03d}",
                    sale_type=choice(["RETAIL", "WHOLESALE"]),
                    cash_shift=shift,
                    subtotal=Decimal("0.00"),
                    total_amount=Decimal("0.00"),
                )

                for product in selected_products:
                    qty = Decimal(str(randint(1, 4)))
                    price = (
                        product.wholesale_price
                        if sale.sale_type == "WHOLESALE"
                        else product.retail_price
                    )
                    total = qty * price

                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=qty,
                        unit_price=price,
                        cost_price=product.cost_price,
                        total=total,
                    )

                    sale_total += total

                sale.subtotal = sale_total
                sale.total_amount = sale_total
                sale.save()

                Payment.objects.create(
                    sale=sale,
                    amount=sale_total,
                    payment_method="CASH",
                    received_by=cashier,
                )

                shift_sales_total += sale_total

            difference = Decimal(str(choice([-100, -50, 0, 0, 0, 50])))
            shift.expected_cash = opening_cash + shift_sales_total
            shift.closing_cash = shift.expected_cash + difference
            shift.difference = difference
            shift.save()

        self.stdout.write("Creating demo returns...")

        demo_sales = list(Sale.objects.all()[:8])

        for index, sale in enumerate(demo_sales):
            if not sale.items.exists():
                continue

            sale_item = sale.items.first()
            refund_amount = sale_item.unit_price

            sale_return = SaleReturn.objects.create(
                sale=sale,
                branch=sale.branch,
                returned_by=cashier,
                refund_processed_by=cashier,
                reason=choice(
                    [
                        "Customer changed mind",
                        "Damaged item",
                        "Wrong item purchased",
                        "Expired product",
                    ]
                ),
                total_refund_amount=refund_amount,
                receipt_verified=index % 3 != 0,
                refund_risk_level=choice(["LOW", "MEDIUM", "HIGH"]),
                risk_notes="Demo return for manager review.",
                manager_reviewed=index % 2 == 0,
                manager_reviewed_by=admin if index % 2 == 0 else None,
                manager_reviewed_at=timezone.now() if index % 2 == 0 else None,
            )

        self.stdout.write(self.style.SUCCESS("NexaPOS demo data seeded successfully."))
