"""
Shared fixtures for unit tests.
Mocks database connections and provides common test data.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4
from datetime import datetime, date
from pydantic import UUID4

from nw_tracker.models.models import Account, AccountGroup, Balance, User


# ==================== Mock DB Session ====================

@pytest.fixture
def mock_async_session():
    """Mock AsyncSession for unit tests."""
    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.add = MagicMock()
    session.delete = AsyncMock()  # This is async too
    return session


# ==================== Mock Users ====================

@pytest.fixture
def mock_user():
    """Create a mock User object."""
    user = MagicMock(spec=User)
    user.id = uuid4()
    user.username = "testuser"
    user.email = "test@example.com"
    user.password_hash = "$2b$12$hashed_password"
    user.is_active = True
    user.last_login = None
    user.created_at = datetime.now()
    user.updated_at = datetime.now()
    return user


@pytest.fixture
def mock_user_list(mock_user):
    """Create a list of mock users."""
    users = []
    for i in range(3):
        user = MagicMock(spec=User)
        user.id = uuid4()
        user.username = f"user{i}"
        user.email = f"user{i}@example.com"
        user.is_active = True
        user.created_at = datetime.now()
        user.updated_at = datetime.now()
        users.append(user)
    return users


# ==================== Mock Accounts ====================

@pytest.fixture
def mock_account(mock_user):
    """Create a mock Account object."""
    account = MagicMock(spec=Account)
    account.id = uuid4()
    account.account_name = "Test Account"
    account.currency = "GBP"
    account.account_type = "savings"
    account.user_id = mock_user.id
    account.created_at = datetime.now()
    account.updated_at = datetime.now()
    account.balances = []
    account.groups = []
    return account


@pytest.fixture
def mock_account_list(mock_user):
    """Create a list of mock accounts."""
    accounts = []
    for i in range(3):
        account = MagicMock(spec=Account)
        account.id = uuid4()
        account.account_name = f"Account {i}"
        account.currency = "GBP"
        account.account_type = "savings"
        account.user_id = mock_user.id
        account.created_at = datetime.now()
        account.updated_at = datetime.now()
        account.balances = []
        account.groups = []
        accounts.append(account)
    return accounts


# ==================== Mock Balances ====================

@pytest.fixture
def mock_balance(mock_account):
    """Create a mock Balance object."""
    balance = MagicMock(spec=Balance)
    balance.id = uuid4()
    balance.amount = 1500.50
    balance.date = date.today()
    balance.account_uuid = mock_account.id
    balance.created_at = datetime.now()
    balance.updated_at = datetime.now()
    return balance


@pytest.fixture
def mock_balance_list(mock_account):
    """Create a list of mock balances."""
    balances = []
    for i in range(3):
        balance = MagicMock(spec=Balance)
        balance.id = uuid4()
        balance.amount = 1000.0 + (i * 100)
        balance.date = date.today()
        balance.account_uuid = mock_account.id
        balance.created_at = datetime.now()
        balance.updated_at = datetime.now()
        balances.append(balance)
    return balances


# ==================== Mock Account Groups ====================

@pytest.fixture
def mock_account_group(mock_user):
    """Create a mock AccountGroup object."""
    group = MagicMock(spec=AccountGroup)
    group.id = uuid4()
    group.name = "Test Group"
    group.description = "Test group description"
    group.user_id = mock_user.id
    group.created_at = datetime.now()
    group.updated_at = datetime.now()
    group.accounts = []
    return group


# ==================== Mock Query Results ====================

@pytest.fixture
def mock_db_result():
    """Helper to create mock database query results."""
    def _create_result(items):
        """Create a mock result with scalars() method."""
        result = MagicMock()

        # Mock scalars().all()
        result.scalars.return_value.all.return_value = items

        # Mock scalars().first()
        if items:
            result.scalars.return_value.first.return_value = items[0]
        else:
            result.scalars.return_value.first.return_value = None

        return result

    return _create_result


# ==================== Mock Repository ====================

@pytest.fixture
def mock_base_repository(mock_async_session):
    """Create a mock GenericRepository for testing."""
    from nw_tracker.repositories.base_repository import GenericRepository
    from nw_tracker.models.models import Account

    # Use real class but with mocked session
    return GenericRepository(mock_async_session, Account)


# ==================== Test Data Factories ====================

@pytest.fixture
def sample_user_dict():
    """Sample user data as dict."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password123!",
    }


@pytest.fixture
def sample_account_dict():
    """Sample account data as dict."""
    return {
        "account_name": "Test Account",
        "currency": "GBP",
        "account_type": "savings",
        "balances": [],
        "groups": [],
    }


@pytest.fixture
def sample_balance_dict():
    """Sample balance data as dict."""
    return {
        "amount": 1500.50,
        "date": date.today(),
    }


@pytest.fixture
def sample_account_group_dict():
    """Sample account group data as dict."""
    return {
        "name": "Test Group",
        "description": "Test group description",
        "accounts": [],
    }
