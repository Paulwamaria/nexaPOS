# NexaPOS

Modern multi-branch Point of Sale (POS) system for retail and wholesale businesses.

NexaPOS is a scalable POS platform designed to support inventory management, branch operations, cashier accountability, expense tracking, retail and wholesale sales, and role-based access control.

Built with a modern full-stack architecture for performance, maintainability, and real-world business workflows.

---

## Features

### Multi-Branch Management

* Multiple branch support
* Branch-specific inventory
* Branch-level sales tracking
* Staff assignment per branch

### Inventory Management

* Product and category management
* SKU and barcode support
* Branch-specific stock levels
* Stock movement tracking
* Low stock monitoring
* Retail and wholesale pricing

### Sales & POS

* Retail checkout
* Wholesale checkout
* Cart-based POS flow
* Multiple payment methods
* Cashier accountability
* Sales history tracking

### Expense Management

* Expense categories
* Branch-specific expenses
* Expense tracking and reporting

### Role-Based Access Control

NexaPOS supports multiple permission levels:

| Role         | Description                  |
| ------------ | ---------------------------- |
| Superadmin   | Full system control          |
| Admin        | Branch and staff management  |
| Store Keeper | Inventory and stock handling |
| Cashier      | POS checkout and sales       |

---

## Tech Stack

### Backend

* Python
* Django
* Django REST Framework
* PostgreSQL
* JWT Authentication

### Frontend (Planned)

* Next.js
* TypeScript
* Tailwind CSS

---

## System Architecture

```txt
backend/
├── apps/
│   ├── accounts/
│   ├── branches/
│   ├── inventory/
│   ├── sales/
│   ├── expenses/
│   ├── reports/
│   └── audit/
```

---

## Database Modules

### Accounts

* Custom User Model
* Role Management
* Branch Assignment

### Branches

* Branch Management
* User-to-Branch Mapping

### Inventory

* Categories
* Products
* Branch Stock
* Stock Movement Tracking

### Sales

* Customers
* Cash Shifts
* Sales
* Sale Items
* Payments

### Expenses

* Expense Categories
* Expense Tracking

---

## Current MVP Scope

### Included

* Authentication
* Multi-branch support
* Inventory management
* Retail & wholesale pricing
* POS sales system
* Expense tracking
* Role permissions
* Cashier shift tracking

### Planned

* Barcode scanning
* Supplier purchase orders
* Stock transfers
* Returns & refunds
* M-Pesa integration
* Receipt printing
* Analytics dashboard
* Offline support

---

## Local Development Setup

### Clone Repository

```bash
git clone <repo-url>
cd nexapos
```

### Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create:

```txt
backend/.env
```

Example:

```env
SECRET_KEY=your-secret-key
DEBUG=True

DB_NAME=nexapos
DB_USER=nexapos_user
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
```

### Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Create Admin User

```bash
python manage.py createsuperuser
```

### Run Server

```bash
python manage.py runserver
```

Visit:

```txt
http://127.0.0.1:8000/admin
```

---

## Project Status

🚧 Active Development

The MVP foundation is currently being implemented, including:

* Authentication
* Role system
* Inventory architecture
* Sales engine
* Expense tracking
* Admin workflows

---

## Why NexaPOS?

Most POS systems are either too bloated, expensive, or poorly adapted to growing businesses.

NexaPOS is being built to provide:

* Simplicity for daily operations
* Scalability for growing businesses
* Strong inventory controls
* Multi-branch visibility
* Modern developer-friendly architecture

---

## License

MIT License

