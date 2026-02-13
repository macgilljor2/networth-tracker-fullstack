"""
Script to populate the database with test data for manual API testing.
This script creates a test user, accounts, balances, and account groups.
"""
import asyncio
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from nw_tracker.config.database import AsyncSessionLocal
from nw_tracker.models.models import User, Account, Balance, AccountGroup, UserSettings, account_group_association, AccountType, Currency, Theme
from nw_tracker.models.auth_models import RefreshToken
from nw_tracker.config.security import create_access_token, create_refresh_token
from nw_tracker.config.settings import get_settings

settings = get_settings()


async def populate_test_data():
    """Populate the database with test data."""
    print("🔧 Connecting to database...")
    async with AsyncSessionLocal() as session:
        # Check if test user already exists by username OR email
        result = await session.execute(
            select(User).where(
                (User.username == "testuser") | (User.email == "testuser@networthtracker.com")
            )
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"⚠️  Test user already exists (ID: {existing_user.id}, Email: {existing_user.email})")
            print("🗑️  Cleaning up existing test data...")
            # Delete all data for this user using raw SQL for cascade
            await session.execute(
                account_group_association.delete().where(
                    account_group_association.c.group_id.in_(
                        select(AccountGroup.id).where(AccountGroup.user_id == existing_user.id)
                    )
                )
            )
            await session.execute(
                RefreshToken.__table__.delete().where(RefreshToken.user_id == existing_user.id)
            )
            await session.execute(
                Balance.__table__.delete().where(
                    Balance.account_uuid.in_(
                        select(Account.id).where(Account.user_id == existing_user.id)
                    )
                )
            )
            await session.execute(
                Account.__table__.delete().where(Account.user_id == existing_user.id)
            )
            await session.execute(
                AccountGroup.__table__.delete().where(AccountGroup.user_id == existing_user.id)
            )
            await session.execute(
                UserSettings.__table__.delete().where(UserSettings.user_id == existing_user.id)
            )
            await session.execute(
                User.__table__.delete().where(User.id == existing_user.id)
            )
            await session.commit()
            print("✅ Existing test data cleaned up")

        # Import password hashing function
        from nw_tracker.config.security import get_password_hash

        # Create test user
        print("\n👤 Creating test user...")
        test_user = User(
            id=uuid4(),
            username="testuser",
            email="testuser@networthtracker.com",
            is_active=True,
        )
        # Hash password
        test_user.password_hash = get_password_hash("TestPassword123!")
        session.add(test_user)
        await session.flush()  # Get the user ID

        print(f"✅ User created: {test_user.email}")
        print(f"   ID: {test_user.id}")
        print(f"   Username: {test_user.username}")
        print(f"   Password: TestPassword123!")

        # Create user settings
        print("\n⚙️  Creating user settings...")
        settings_obj = UserSettings(
            user_id=test_user.id,
            theme=Theme.LIGHT,
            language="en"
        )
        session.add(settings_obj)

        # Create accounts
        print("\n💰 Creating accounts...")
        account1 = Account(
            id=uuid4(),
            account_name="Main Savings",
            currency=Currency.GBP,
            account_type=AccountType.SAVINGS,
            user_id=test_user.id
        )
        session.add(account1)
        await session.flush()

        account2 = Account(
            id=uuid4(),
            account_name="Current Account",
            currency=Currency.GBP,
            account_type=AccountType.CURRENT,
            user_id=test_user.id
        )
        session.add(account2)
        await session.flush()

        account3 = Account(
            id=uuid4(),
            account_name="Investment Portfolio",
            currency=Currency.USD,
            account_type=AccountType.INVESTMENT,
            user_id=test_user.id
        )
        session.add(account3)
        await session.flush()

        account4 = Account(
            id=uuid4(),
            account_name="Emergency Fund",
            currency=Currency.USD,
            account_type=AccountType.SAVINGS,
            user_id=test_user.id
        )
        session.add(account4)
        await session.flush()

        print(f"✅ Created 4 accounts:")
        print(f"   - {account1.account_name} (ID: {account1.id})")
        print(f"   - {account2.account_name} (ID: {account2.id})")
        print(f"   - {account3.account_name} (ID: {account3.id})")
        print(f"   - {account4.account_name} (ID: {account4.id})")

        # Create balances for each account
        print("\n📊 Creating balances...")

        # Balances for Main Savings (GBP)
        today = date.today()
        balances_data = [
            # Main Savings - growing over time
            (account1.id, 15000.00, today - timedelta(days=365)),
            (account1.id, 15500.00, today - timedelta(days=270)),
            (account1.id, 16000.00, today - timedelta(days=180)),
            (account1.id, 17500.00, today - timedelta(days=90)),
            (account1.id, 18250.50, today - timedelta(days=30)),
            (account1.id, 19000.00, today),

            # Current Account - recent activity
            (account2.id, 2500.00, today - timedelta(days=60)),
            (account2.id, 3200.00, today - timedelta(days=30)),
            (account2.id, 2850.75, today - timedelta(days=15)),
            (account2.id, 3450.25, today),

            # Investment Portfolio - USD
            (account3.id, 45000.00, today - timedelta(days=180)),
            (account3.id, 47500.00, today - timedelta(days=120)),
            (account3.id, 51000.00, today - timedelta(days=60)),
            (account3.id, 48500.00, today - timedelta(days=30)),
            (account3.id, 52500.00, today),

            # Emergency Fund - USD
            (account4.id, 10000.00, today - timedelta(days=365)),
            (account4.id, 12000.00, today - timedelta(days=180)),
            (account4.id, 15000.00, today),
        ]

        for account_id, amount_val, balance_date in balances_data:
            balance = Balance(
                id=uuid4(),
                amount=amount_val,
                date=balance_date,
                account_uuid=account_id
            )
            session.add(balance)

        print(f"✅ Created {len(balances_data)} balance records")

        # Create account groups
        print("\n📁 Creating account groups...")
        group1 = AccountGroup(
            id=uuid4(),
            name="Banking",
            description="All bank accounts including savings and current accounts",
            user_id=test_user.id
        )
        session.add(group1)
        await session.flush()

        group2 = AccountGroup(
            id=uuid4(),
            name="Investments",
            description="Investment and savings accounts",
            user_id=test_user.id
        )
        session.add(group2)
        await session.flush()

        print(f"✅ Created 2 account groups:")
        print(f"   - {group1.name} (ID: {group1.id})")
        print(f"   - {group2.name} (ID: {group2.id})")

        # Associate accounts with groups
        print("\n🔗 Associating accounts with groups...")
        associations = [
            (account1.id, group1.id),  # Main Savings -> Banking
            (account2.id, group1.id),  # Current Account -> Banking
            (account3.id, group2.id),  # Investment Portfolio -> Investments
            (account4.id, group2.id),  # Emergency Fund -> Investments
        ]

        for acc_id, grp_id in associations:
            await session.execute(
                account_group_association.insert().values(account_id=acc_id, group_id=grp_id)
            )

        print(f"✅ Created {len(associations)} account-group associations")

        # Generate JWT tokens for testing
        print("\n🔑 Generating JWT tokens...")
        access_token = create_access_token(
            data={"sub": str(test_user.id), "username": test_user.username}
        )

        # Create refresh token
        refresh_token_str = create_refresh_token(
            data={"sub": str(test_user.id), "type": "refresh"}
        )
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=test_user.id,
            expires_at=datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days),
            revoked=False
        )
        session.add(refresh_token)

        # Commit everything
        await session.commit()
        print("\n✅ All data committed successfully!")

        # Print summary
        print("\n" + "="*70)
        print("📋 TEST DATA SUMMARY")
        print("="*70)
        print(f"\n👤 USER CREDENTIALS:")
        print(f"   Email:    testuser@networthtracker.com")
        print(f"   Password: TestPassword123!")
        print(f"   User ID:  {test_user.id}")
        print(f"\n🔑 AUTH TOKENS:")
        print(f"   Access Token:")
        print(f"   {access_token}")
        print(f"\n   Refresh Token:")
        print(f"   {refresh_token_str}")
        print(f"\n💰 ACCOUNTS ({len([account1, account2, account3, account4])}):")
        print(f"   1. {account1.account_name} ({account1.currency}) - ID: {account1.id}")
        print(f"      Latest Balance: £19,000.00")
        print(f"   2. {account2.account_name} ({account2.currency}) - ID: {account2.id}")
        print(f"      Latest Balance: £3,450.25")
        print(f"   3. {account3.account_name} ({account3.currency}) - ID: {account3.id}")
        print(f"      Latest Balance: $52,500.00")
        print(f"   4. {account4.account_name} ({account4.currency}) - ID: {account4.id}")
        print(f"      Latest Balance: $15,000.00")
        print(f"\n📁 ACCOUNT GROUPS ({len([group1, group2])}):")
        print(f"   1. {group1.name} - ID: {group1.id}")
        print(f"      Accounts: Main Savings, Current Account")
        print(f"   2. {group2.name} - ID: {group2.id}")
        print(f"      Accounts: Investment Portfolio, Emergency Fund")
        print(f"\n📊 BALANCE RECORDS: {len(balances_data)} total")
        print("="*70)

        # Save tokens to file for easy access
        tokens_file = Path(__file__).parent / "test_tokens.txt"
        with open(tokens_file, "w") as f:
            f.write(f"Email: testuser@networthtracker.com\n")
            f.write(f"Password: TestPassword123!\n")
            f.write(f"User ID: {test_user.id}\n")
            f.write(f"\nAccess Token:\n{access_token}\n")
            f.write(f"\nRefresh Token:\n{refresh_token_str}\n")
            f.write(f"\nAccount IDs:\n")
            f.write(f"Main Savings: {account1.id}\n")
            f.write(f"Current Account: {account2.id}\n")
            f.write(f"Investment Portfolio: {account3.id}\n")
            f.write(f"Emergency Fund: {account4.id}\n")
            f.write(f"\nGroup IDs:\n")
            f.write(f"Banking: {group1.id}\n")
            f.write(f"Investments: {group2.id}\n")

        print(f"\n💾 Tokens saved to: {tokens_file}")
        print("\n✅ Test data population complete!")
        print("\nNext steps:")
        print("1. Start the API server: uvicorn nw_tracker.main:app --reload")
        print("2. Use the tokens above to test the endpoints")
        print("3. Or login with: POST /api/v1/auth/login")


if __name__ == "__main__":
    asyncio.run(populate_test_data())
