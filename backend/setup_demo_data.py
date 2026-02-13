#!/usr/bin/env python3
"""
Setup script to create demo data for the net worth tracker.
Deletes existing data and creates realistic UK accounts with historical balances.
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
ACCOUNT_TYPES = [
    {"name": "HSBC Premier Savings", "type": "savings", "currency": "GBP"},
    {"name": "Lloyds Club Lloyds", "type": "current", "currency": "GBP"},
    {"name": "Barclays Smart Investor", "type": "investment", "currency": "GBP"},
    {"name": "Nationwide FlexPlus", "type": "current", "currency": "GBP"},
    {"name": "Santander Edge", "type": "savings", "currency": "GBP"},
    {"name": "Fidelity Personal Investing", "type": "investment", "currency": "GBP"},
]

# Investment growth patterns (volatility and trend)
INVESTMENT_PATTERNS = {
    "conservative": {"volatility": 0.02, "monthly_return": 0.005},
    "moderate": {"volatility": 0.04, "monthly_return": 0.007},
    "aggressive": {"volatility": 0.08, "monthly_return": 0.01},
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

def generate_balance_history(start_amount: float, account_type: str, start_date: datetime, end_date: datetime):
    """
    Generate realistic balance history over time.
    Investments: volatile with general upward trend
    Savings: steady growth with occasional deposits
    Current: varies with spending patterns and income deposits
    """
    balances = []
    current_date = start_date
    current_balance = start_amount

    # Determine pattern based on account type
    if account_type == "investment":
        pattern = random.choice(list(INVESTMENT_PATTERNS.values()))
        volatility = pattern["volatility"]
        monthly_return = pattern["monthly_return"]
    elif account_type == "savings":
        volatility = 0.005  # Low volatility
        monthly_return = 0.003  # Steady growth
    else:  # current
        volatility = 0.03  # Higher volatility due to spending
        monthly_return = 0.002  # Slight upward trend

    # Generate bi-weekly balances
    while current_date <= end_date:
        # Add some randomness
        daily_change = random.gauss(0, volatility / 4)  # Daily volatility

        # Add salary deposits for current accounts (last Friday of month)
        if account_type == "current" and current_date.day >= 25 and current_date.day <= 28:
            if current_date.weekday() == 4:  # Friday
                current_balance += random.uniform(2500, 4000)  # Salary deposit

        # Add interest/growth
        if current_date.day == 1:  # First of month
            monthly_growth = current_balance * monthly_return
            current_balance += monthly_growth

        # Random deposits for savings
        if account_type == "savings" and random.random() < 0.1:  # 10% chance
            current_balance += random.uniform(100, 500)

        # Apply daily change
        current_balance += current_balance * daily_change

        # Ensure balance doesn't go negative for current accounts
        if account_type == "current" and current_balance < 500:
            current_balance = 500  # Minimum balance

        # Round to 2 decimal places
        current_balance = round(current_balance, 2)

        balances.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "amount": current_balance
        })

        # Move forward 2 weeks
        current_date += timedelta(days=14)

    return balances

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

    # Create demo accounts
    print("\n💰 Creating demo accounts...")
    created_accounts = []

    # Starting balances (in GBP)
    starting_balances = {
        "HSBC Premier Savings": 25000,
        "Lloyds Club Lloyds": 3500,
        "Barclays Smart Investor": 45000,
        "Nationwide FlexPlus": 2800,
        "Santander Edge": 15000,
        "Fidelity Personal Investing": 38000,
    }

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
                "start_balance": starting_balances[acc_config["name"]]
            })

    # Generate historical balances (going back 3 years)
    print("\n📊 Generating historical balances...")
    end_date = datetime.now()
    start_date = end_date - relativedelta(years=3)

    for account in created_accounts:
        print(f"  Generating history for {account['account_name']}...")
        balances = generate_balance_history(
            account["start_balance"],
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

    # Group 1: Main Banking
    banking_accounts = [acc for acc in created_accounts if acc["account_type"] == "current"]
    if banking_accounts:
        response = client.session.post(
            f"{BASE_URL}/account-groups",
            json={
                "name": "Main Banking",
                "description": "Primary current accounts for day-to-day transactions",
                "accounts": [acc["id"] for acc in banking_accounts]
            }
        )
        if response.status_code == 200:
            print("  ✓ Created group: Main Banking")

    # Group 2: Savings & Investments
    savings_investments = [acc for acc in created_accounts if acc["account_type"] in ["savings", "investment"]]
    if savings_investments:
        response = client.session.post(
            f"{BASE_URL}/account-groups",
            json={
                "name": "Savings & Investments",
                "description": "Long-term savings and investment portfolios",
                "accounts": [acc["id"] for acc in savings_investments]
            }
        )
        if response.status_code == 200:
            print("  ✓ Created group: Savings & Investments")

    print("\n✅ Demo data setup complete!")
    print(f"   Created {len(created_accounts)} accounts with historical data")
    print(f"   Data spans from {start_date.strftime('%B %Y')} to {end_date.strftime('%B %Y')}")
    print(f"   Total balance entries generated: ~{sum(len(range((datetime.now() - start_date).days // 14)) for _ in created_accounts)}")

if __name__ == "__main__":
    setup_demo_data()
