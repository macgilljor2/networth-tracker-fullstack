#!/usr/bin/env python3
"""
Setup script to create demo data for the net worth tracker.
Deletes existing data and creates realistic UK accounts with historical balances
and budget data showing growth over time with realistic peaks and drops.
"""

import requests
import random
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json

# API Configuration
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test.jordan@gmail.com"
PASSWORD = "test0123"

# Demo Account Types (UK-based)
# Start values are 4 years ago (2021), end values should grow to current targets
ACCOUNT_TYPES = [
    {"name": "HSBC Premier Savings", "type": "savings", "currency": "GBP", "start": 2000, "target": 35000},
    {"name": "Lloyds Club Lloyds", "type": "current", "currency": "GBP", "start": 2000, "target": 4500},
    {"name": "Barclays Smart Investor ISA", "type": "investment", "currency": "GBP", "start": 8000, "target": 28000},
    {"name": "Nationwide FlexPlus", "type": "current", "currency": "GBP", "start": 1500, "target": 3200},
    {"name": "Santander Edge Saver", "type": "savings", "currency": "GBP", "start": 1000, "target": 18000},
    {"name": "Fidelity SIPP (Pension)", "type": "investment", "currency": "GBP", "start": 15000, "target": 42000},
    {"name": "Hargreaves Lansdown", "type": "investment", "currency": "GBP", "start": 25000, "target": 55000},
]

# Budget Categories with realistic UK expenses
BUDGET_CATEGORIES = [
    {"name": "Housing", "icon": "🏠", "color": "#2d5a27", "essential": True},
    {"name": "Groceries", "icon": "🛒", "color": "#7d8471", "essential": True},
    {"name": "Transport", "icon": "🚗", "color": "#c17f59", "essential": True},
    {"name": "Utilities", "icon": "💡", "color": "#a6926a", "essential": True},
    {"name": "Dining Out", "icon": "🍽️", "color": "#16a34a", "essential": False},
    {"name": "Entertainment", "icon": "🎬", "color": "#7c3aed", "essential": False},
    {"name": "Shopping", "icon": "🛍️", "color": "#ec4899", "essential": False},
    {"name": "Health", "icon": "💊", "color": "#0891b2", "essential": True},
]

# Monthly expense examples
MONTHLY_EXPENSES = {
    "Housing": [
        {"description": "Rent/Mortgage", "amount": 1800},
        {"description": "Council Tax", "amount": 150},
    ],
    "Groceries": [
        {"description": "Weekly Shop", "amount": 400},
        {"description": "Costco Run", "amount": 200},
    ],
    "Transport": [
        {"description": "Car Insurance", "amount": 80},
        {"description": "Fuel", "amount": 120},
        {"description": "Public Transport", "amount": 100},
    ],
    "Utilities": [
        {"description": "Electricity & Gas", "amount": 150},
        {"description": "Water", "amount": 35},
        {"description": "Internet & Mobile", "amount": 85},
    ],
    "Dining Out": [
        {"description": "Restaurants", "amount": 250},
        {"description": "Takeaways", "amount": 100},
    ],
    "Entertainment": [
        {"description": "Netflix & Subs", "amount": 45},
        {"description": "Cinema & Events", "amount": 80},
    ],
    "Shopping": [
        {"description": "Clothing", "amount": 150},
        {"description": "Amazon", "amount": 100},
    ],
    "Health": [
        {"description": "Gym Membership", "amount": 45},
        {"description": "Health Insurance", "amount": 60},
    ],
}

# Monthly income examples
MONTHLY_INCOME = [
    {"description": "Salary (Net)", "amount": 5500, "is_net": True},
    {"description": "Dividend Income", "amount": 350, "is_net": True},
]

# One-off expenses examples
ONE_OFF_EXPENSES = {
    2024: [
        {"month": 1, "description": "Car Service", "amount": 450},
        {"month": 3, "description": "New Laptop", "amount": 1200},
        {"month": 5, "description": "Holiday Deposit", "amount": 800},
        {"month": 8, "description": "Summer Holiday", "amount": 2500},
        {"month": 11, "description": "Christmas Shopping", "amount": 1500},
    ],
    2025: [
        {"month": 1, "description": "Car Insurance Annual", "amount": 650},
        {"month": 2, "description": "Dental Work", "amount": 400},
        {"month": 4, "description": "New Furniture", "amount": 1800},
        {"month": 6, "description": "Flights", "amount": 900},
    ]
}

# One-off income examples
ONE_OFF_INCOME = {
    2024: [
        {"month": 3, "description": "Work Bonus", "amount": 3500},
        {"month": 6, "description": "Freelance Project", "amount": 1200},
        {"month": 12, "description": "Year-End Bonus", "amount": 5000},
    ],
    2025: [
        {"month": 1, "description": "Tax Refund", "amount": 850},
        {"month": 4, "description": "Investment Sale", "amount": 2200},
    ]
}

class APIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None

    def login(self, email: str, password: str):
        """Login and get access token"""
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
            print("✓ Login successful")
            return True
        else:
            print(f"✗ Login failed: {response.text}")
            return False

    def get_accounts(self):
        """Get all accounts"""
        response = self.session.get(f"{self.base_url}/accounts")
        return response.json() if response.status_code == 200 else []

    def delete_account(self, account_id: str):
        """Delete an account"""
        response = self.session.delete(f"{self.base_url}/accounts/{account_id}")
        if response.status_code == 200:
            print(f"  ✓ Deleted account {account_id}")
            return True
        return False

    def get_groups(self):
        """Get all account groups"""
        response = self.session.get(f"{self.base_url}/account-groups")
        return response.json() if response.status_code == 200 else []

    def delete_group(self, group_id: str):
        """Delete an account group"""
        response = self.session.delete(f"{self.base_url}/account-groups/{group_id}")
        if response.status_code == 200:
            print(f"  ✓ Deleted group {group_id}")
            return True
        return False

    def create_account(self, name: str, account_type: str, currency: str):
        """Create a new account"""
        response = self.session.post(
            f"{self.base_url}/accounts",
            json={
                "account_name": name,
                "account_type": account_type,
                "currency": currency
            }
        )
        if response.status_code in [200, 201]:
            account = response.json()
            print(f"  ✓ Created account: {name}")
            return account
        else:
            print(f"  ✗ Failed to create account {name}: {response.text}")
            return None

    def add_balance(self, account_id: str, amount: float, date: str, currency: str):
        """Add a balance entry to an account"""
        response = self.session.post(
            f"{self.base_url}/accounts/{account_id}/balances",
            json={
                "amount": amount,
                "currency": currency,
                "date": date
            }
        )
        if response.status_code not in [200, 201]:
            print(f"    ✗ Failed to add balance for {date}: {response.text}")
        return response.status_code in [200, 201]

    def create_group(self, name: str, description: str, account_ids: list):
        """Create an account group"""
        response = self.session.post(
            f"{self.base_url}/account-groups",
            json={
                "name": name,
                "description": description,
                "accounts": account_ids
            }
        )
        if response.status_code in [200, 201]:
            print(f"  ✓ Created group: {name}")
            return response.json()
        else:
            print(f"  ✗ Failed to create group {name}: {response.text}")
            return None

    # Budget methods
    def get_budget_categories(self):
        """Get all budget categories"""
        response = self.session.get(f"{self.base_url}/budget-categories")
        return response.json() if response.status_code == 200 else []

    def delete_budget_category(self, category_id: str):
        """Delete a budget category"""
        response = self.session.delete(f"{self.base_url}/budget-categories/{category_id}")
        if response.status_code == 200:
            print(f"  ✓ Deleted budget category")
            return True
        return False

    def create_budget_category(self, name: str, icon: str, color: str, essential: bool):
        """Create a budget category"""
        response = self.session.post(
            f"{self.base_url}/budget-categories",
            json={
                "name": name,
                "icon": icon,
                "color": color,
                "is_essential": essential
            }
        )
        if response.status_code in [200, 201]:
            print(f"  ✓ Created category: {name}")
            return response.json()
        else:
            print(f"  ✗ Failed to create category {name}: {response.text}")
            return None

    def create_income(self, description: str, amount: float, frequency: str,
                     is_net: bool, effective_month: int = None, effective_year: int = None):
        """Create an income entry"""
        data = {
            "description": description,
            "amount": amount,
            "frequency": frequency,
            "is_net": is_net
        }
        if effective_month:
            data["effective_month"] = effective_month
        if effective_year:
            data["effective_year"] = effective_year

        response = self.session.post(f"{self.base_url}/income", json=data)
        if response.status_code in [200, 201]:
            return response.json()
        return None

    def create_expense(self, description: str, amount: float, frequency: str,
                      category_id: str, effective_month: int = None, effective_year: int = None):
        """Create an expense entry"""
        data = {
            "description": description,
            "amount": amount,
            "frequency": frequency,
            "category_id": category_id
        }
        if effective_month:
            data["effective_month"] = effective_month
        if effective_year:
            data["effective_year"] = effective_year

        response = self.session.post(f"{self.base_url}/expenses", json=data)
        if response.status_code in [200, 201]:
            return response.json()
        return None

    def get_income(self):
        """Get all income entries"""
        response = self.session.get(f"{self.base_url}/income")
        return response.json() if response.status_code == 200 else []

    def delete_income(self, income_id: str):
        """Delete an income entry"""
        return self.session.delete(f"{self.base_url}/income/{income_id}").status_code == 200

    def get_expenses(self):
        """Get all expense entries"""
        response = self.session.get(f"{self.base_url}/expenses")
        return response.json() if response.status_code == 200 else []

    def delete_expense(self, expense_id: str):
        """Delete an expense entry"""
        return self.session.delete(f"{self.base_url}/expenses/{expense_id}").status_code == 200


def generate_balance_history(start_amount: float, target_amount: float, account_type: str,
                             start_date: datetime, end_date: datetime):
    """
    Generate realistic balance history over time with growth from start to target.

    - Investments: volatile growth with market corrections, grows significantly
    - Savings: steady consistent growth with periodic deposits
    - Current: stays relatively even with salary in/spending out
    """
    balances = []
    current_date = start_date
    current_balance = start_amount

    # Calculate total growth needed and monthly contribution
    months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)

    # Market events that cause peaks/drops
    market_events = {
        datetime(2021, 9, 1): -0.08,   # COVID aftershock
        datetime(2021, 12, 1): 0.06,   # Year-end rally
        datetime(2022, 6, 1): -0.12,   # 2022 bear market
        datetime(2022, 10, 1): 0.10,   # Recovery
        datetime(2023, 3, 1): -0.05,   # Banking crisis
        datetime(2023, 7, 1): 0.12,    # Bull market
        datetime(2024, 4, 1): -0.07,   # Correction
        datetime(2024, 11, 1): 0.15,   # Year-end surge
    }

    # Generate monthly balances
    month_count = 0
    while current_date <= end_date:
        month_count += 1

        # Apply market events for investments
        if account_type == "investment" and current_date in market_events:
            current_balance *= (1 + market_events[current_date])

        # Calculate base growth for this month
        if account_type == "investment":
            # High volatility, strong growth
            monthly_return = random.uniform(0.005, 0.025)  # 0.5% to 2.5% per month
            volatility = random.uniform(-0.04, 0.06)  # Can swing 4% down to 6% up

            # Add monthly contribution (simulating regular investments)
            monthly_contribution = (target_amount - start_amount) / months * 0.8
            current_balance += monthly_contribution

        elif account_type == "savings":
            # Steady growth with deposits
            monthly_return = 0.003  # 0.3% interest monthly
            volatility = random.uniform(-0.001, 0.002)  # Minimal volatility

            # Quarterly deposits (Mar, Jun, Sep, Dec)
            if current_date.month in [3, 6, 9, 12]:
                deposit = random.uniform(800, 2500)
                current_balance += deposit

        else:  # current accounts
            # Minimal growth, salary in/spending out
            monthly_return = 0.0005  # Almost no growth
            volatility = 0

            # Last Friday of month: salary deposit
            if current_date.day >= 25 and current_date.day <= 28:
                if current_date.weekday() == 4:  # Friday
                    current_balance += random.uniform(3500, 4500)  # Salary

            # Rest of month: gradual spending
            spending = random.uniform(2800, 3800)
            current_balance -= spending

            # Keep it in reasonable range
            if current_balance < 1000:
                current_balance += 1000  # Top up
            if current_balance > 6000:
                current_balance -= 2000  # Transfer out

        # Apply growth and volatility
        if account_type != "current":
            current_balance *= (1 + monthly_return + volatility)

        # Round to 2 decimal places
        current_balance = round(current_balance, 2)

        # Ensure no negative balances
        if current_balance < 0:
            current_balance = 100

        balances.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "amount": current_balance
        })

        # Move forward 1 month
        current_date += relativedelta(months=1)

    return balances


def setup_budget_data(client: APIClient):
    """Setup budget categories and expenses/income"""
    print("\n📊 Setting up budget data...")

    # Delete existing budget data
    print("  Cleaning up existing budget data...")
    for income in client.get_income():
        client.delete_income(income["id"])
    for expense in client.get_expenses():
        client.delete_expense(expense["id"])
    for category in client.get_budget_categories():
        client.delete_budget_category(category["id"])

    # Create categories
    print("\n  Creating budget categories...")
    category_map = {}
    for cat in BUDGET_CATEGORIES:
        created = client.create_budget_category(
            cat["name"], cat["icon"], cat["color"], cat["essential"]
        )
        if created:
            category_map[cat["name"]] = created["id"]

    # Create monthly income
    print("\n  Creating monthly income...")
    for inc in MONTHLY_INCOME:
        client.create_income(
            inc["description"],
            inc["amount"],
            "MONTHLY",
            inc["is_net"]
        )

    # Create monthly expenses
    print("  Creating monthly expenses...")
    for category_name, expenses in MONTHLY_EXPENSES.items():
        category_id = category_map.get(category_name)
        if category_id:
            for exp in expenses:
                client.create_expense(
                    exp["description"],
                    exp["amount"],
                    "MONTHLY",
                    category_id
                )

    # Create one-off income for 2024 and 2025
    print("  Creating one-off income...")
    for year, incomes in ONE_OFF_INCOME.items():
        for inc in incomes:
            client.create_income(
                inc["description"],
                inc["amount"],
                "ONE_TIME",
                True,
                inc["month"],
                year
            )

    # Create one-off expenses for 2024 and 2025
    print("  Creating one-off expenses...")
    for year, expenses in ONE_OFF_EXPENSES.items():
        for exp in expenses:
            category_id = category_map.get("Shopping")  # Default to shopping
            client.create_expense(
                exp["description"],
                exp["amount"],
                "ONE_TIME",
                category_id,
                exp["month"],
                year
            )

    print("\n  ✅ Budget data created!")


def setup_demo_data():
    """Setup demo data for testing"""
    client = APIClient(BASE_URL)

    # Login
    if not client.login(EMAIL, PASSWORD):
        return False

    # Delete existing accounts
    print("\n🗑️  Cleaning up existing data...")
    accounts = client.get_accounts()
    print(f"Found {len(accounts)} existing accounts")
    for account in accounts:
        client.delete_account(account["id"])

    # Delete existing groups
    groups = client.get_groups()
    print(f"Found {len(groups)} existing groups")
    for group in groups:
        client.delete_group(group["id"])

    # Setup budget data
    setup_budget_data(client)

    # Create demo accounts
    print("\n💰 Creating demo accounts...")
    created_accounts = []

    for acc_config in ACCOUNT_TYPES:
        account = client.create_account(
            acc_config["name"],
            acc_config["type"],
            acc_config["currency"]
        )
        if account:
            created_accounts.append({
                **account,
                "type": acc_config["type"],
                "start_balance": acc_config["start"],
                "target_balance": acc_config["target"]
            })

    # Generate historical balances (going back 4 years)
    print("\n📈 Generating historical balances with realistic growth patterns...")
    end_date = datetime.now()
    start_date = end_date - relativedelta(years=4)

    for account in created_accounts:
        print(f"  Generating history for {account['account_name']}...")
        balances = generate_balance_history(
            account["start_balance"],
            account["target_balance"],
            account["type"],
            start_date,
            end_date
        )

        # Add balances in reverse order (oldest first)
        for balance in reversed(balances):
            client.add_balance(
                account["id"],
                balance["amount"],
                balance["date"],
                account["currency"]
            )

        print(f"    ✓ Added {len(balances)} balance entries")

    # Create account groups
    print("\n📁 Creating account groups...")

    # Group 1: Current Accounts
    current_accounts = [acc for acc in created_accounts if acc["account_type"] == "current"]
    if current_accounts:
        client.create_group(
            "Current Accounts",
            "Day-to-day banking and spending",
            [acc["id"] for acc in current_accounts]
        )

    # Group 2: Savings
    savings_accounts = [acc for acc in created_accounts if acc["account_type"] == "savings"]
    if savings_accounts:
        client.create_group(
            "Savings",
            "Emergency fund and short-term savings",
            [acc["id"] for acc in savings_accounts]
        )

    # Group 3: Investments
    investment_accounts = [acc for acc in created_accounts if acc["account_type"] == "investment"]
    if investment_accounts:
        client.create_group(
            "Investments & Pension",
            "Long-term investments and retirement savings",
            [acc["id"] for acc in investment_accounts]
        )

    # Group 4: All Accounts (Total Net Worth)
    client.create_group(
        "Total Net Worth",
        "Combined view of all accounts",
        [acc["id"] for acc in created_accounts]
    )

    print("\n✅ Demo data setup complete!")
    print(f"   📊 Created {len(created_accounts)} accounts with historical data")
    print(f"   📈 Data spans from {start_date.strftime('%B %Y')} to {end_date.strftime('%B %Y')} (4 years)")
    print(f"   📁 Created 4 account groups")
    print(f"   💷 Total balance entries generated: ~{len(created_accounts) * 48}")
    print(f"   📊 Created {len(BUDGET_CATEGORIES)} budget categories")
    print(f"   💰 Created {len(MONTHLY_INCOME)} monthly income streams")
    print(f"   💸 Created {sum(len(v) for v in MONTHLY_EXPENSES.values())} monthly expense entries")


if __name__ == "__main__":
    setup_demo_data()
