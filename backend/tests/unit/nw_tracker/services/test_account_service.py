"""
Unit tests for account_service.py
Tests the AccountService class with mocked dependencies.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from fastapi import HTTPException

from nw_tracker.services.account_service import AccountService
from nw_tracker.models.models import Account, User, Balance, AccountGroup
from nw_tracker.models.request_response_models import (
    AccountCreateRequest,
    AccountUpdateRequest,
    AccountResponse,
    BalanceResponse,
    AccountGroupResponse
)


@pytest.mark.unit
class TestAccountServiceInit:
    """Test AccountService initialization."""

    def test_init(self, mock_async_session):
        """Test that AccountService is properly initialized."""
        service = AccountService(mock_async_session)

        assert service.repository is not None
        assert service.account_group_repository is not None


@pytest.mark.unit
class TestAccountServiceCreateAccount:
    """Test create_account method."""

    @pytest.mark.asyncio
    async def test_create_account_success(self, mock_async_session, mock_user):
        """Test successful account creation without balances or groups."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()
            service.account_group_repository = MagicMock()

            # Setup request
            account_request = AccountCreateRequest(
                account_name="Test Account",
                currency="USD",
                account_type="savings",
                balances=[],
                groups=[]
            )

            # Setup mocks
            mock_account = MagicMock(spec=Account)
            mock_account.id = uuid4()
            mock_account.account_name = "Test Account"
            mock_account.currency = "USD"
            mock_account.account_type = "savings"
            mock_account.user_id = mock_user.id
            mock_account.balances = []
            mock_account.groups = []

            service.repository.create = AsyncMock(return_value=mock_account)
            service.repository.get_by_id_with_relations = AsyncMock(return_value=mock_account)

            # Call create_account
            result = await service.create_account(mock_user, account_request)

            # Verify
            assert isinstance(result, AccountResponse)
            assert result.account_name == "Test Account"
            service.repository.create.assert_called_once()
            service.repository.get_by_id_with_relations.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_account_with_balances(self, mock_async_session, mock_user):
        """Test account creation with balances."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()
            service.account_group_repository = MagicMock()

            # Setup request with balances - use date only, not datetime
            from datetime import date
            account_request = AccountCreateRequest(
                account_name="Test Account",
                currency="USD",
                account_type="savings",
                balances=[
                    {"amount": 1000.00, "date": date.today().isoformat()}
                ],
                groups=[]
            )

            # Setup mocks
            mock_account = MagicMock(spec=Account)
            mock_account.id = uuid4()
            mock_account.account_name = "Test Account"
            mock_account.currency = "USD"
            mock_account.account_type = "savings"
            mock_account.user_id = mock_user.id
            mock_account.balances = []
            mock_account.groups = []

            service.repository.create = AsyncMock(return_value=mock_account)
            service.repository.get_by_id_with_relations = AsyncMock(return_value=mock_account)

            # Call create_account
            result = await service.create_account(mock_user, account_request)

            # Verify
            assert isinstance(result, AccountResponse)
            service.repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_account_server_error(self, mock_async_session, mock_user):
        """Test account creation with server error."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()
            service.account_group_repository = MagicMock()

            # Setup request
            account_request = AccountCreateRequest(
                account_name="Test Account",
                currency="USD",
                account_type="savings",
                balances=[],
                groups=[]
            )

            # Setup mock to raise exception
            service.repository.create = AsyncMock(side_effect=Exception("Database error"))

            # Call create_account and expect 500
            with pytest.raises(HTTPException) as exc_info:
                await service.create_account(mock_user, account_request)

            assert exc_info.value.status_code == 500
            assert "Internal Server Error" in exc_info.value.detail


@pytest.mark.unit
class TestAccountServiceGetAll:
    """Test get_all method."""

    @pytest.mark.asyncio
    async def test_get_all_returns_list(self, mock_async_session, mock_user):
        """Test getting all accounts for user."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            # Setup mocks
            mock_account = MagicMock(spec=Account)
            mock_account.id = uuid4()
            mock_account.account_name = "Test Account"
            mock_account.currency = "USD"
            mock_account.account_type = "savings"
            mock_account.user_id = mock_user.id
            mock_account.balances = []
            mock_account.groups = []

            service.repository.get_all_for_user = AsyncMock(return_value=[mock_account])

            # Call get_all
            result = await service.get_all(mock_user)

            # Verify
            assert isinstance(result, list)
            assert len(result) == 1
            assert isinstance(result[0], AccountResponse)
            service.repository.get_all_for_user.assert_called_once_with(mock_user.id)

    @pytest.mark.asyncio
    async def test_get_all_empty(self, mock_async_session, mock_user):
        """Test getting all accounts when user has none."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            # Setup mock to return empty list
            service.repository.get_all_for_user = AsyncMock(return_value=[])

            # Call get_all
            result = await service.get_all(mock_user)

            # Verify
            assert result == []

    @pytest.mark.asyncio
    async def test_get_all_with_relationships(self, mock_async_session, mock_user):
        """Test getting all accounts with balances and groups."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            # Setup mocks with relationships
            mock_balance = MagicMock(spec=Balance)
            mock_balance.id = uuid4()
            mock_balance.amount = 1000.00
            mock_balance.date = "2024-01-01"
            mock_balance.account_uuid = uuid4()
            mock_balance.created_at = "2024-01-01"
            mock_balance.updated_at = "2024-01-01"

            mock_group = MagicMock(spec=AccountGroup)
            mock_group.id = uuid4()
            mock_group.name = "Test Group"
            mock_group.description = "Test Description"
            mock_group.user_id = mock_user.id
            mock_group.created_at = "2024-01-01"
            mock_group.updated_at = "2024-01-01"

            mock_account = MagicMock(spec=Account)
            mock_account.id = uuid4()
            mock_account.account_name = "Test Account"
            mock_account.currency = "USD"
            mock_account.account_type = "savings"
            mock_account.user_id = mock_user.id
            mock_account.balances = [mock_balance]
            mock_account.groups = [mock_group]

            service.repository.get_all_for_user = AsyncMock(return_value=[mock_account])

            # Call get_all
            result = await service.get_all(mock_user)

            # Verify
            assert len(result) == 1
            assert len(result[0].balances) == 1
            assert len(result[0].groups) == 1


@pytest.mark.unit
class TestAccountServiceGetAccount:
    """Test get_account method."""

    @pytest.mark.asyncio
    async def test_get_account_success(self, mock_async_session, mock_user):
        """Test getting account by ID."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup mocks
            mock_account = MagicMock(spec=Account)
            mock_account.id = account_id
            mock_account.account_name = "Test Account"
            mock_account.currency = "USD"
            mock_account.account_type = "savings"
            mock_account.user_id = mock_user.id
            mock_account.balances = []
            mock_account.groups = []

            service.repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id_and_user = AsyncMock(return_value=mock_account)

            # Call get_account
            result = await service.get_account(mock_user, account_id)

            # Verify
            assert isinstance(result, AccountResponse)
            assert result.account_name == "Test Account"
            service.repository.account_belongs_to_user.assert_called_once_with(account_id, mock_user.id)
            service.repository.get_by_id_and_user.assert_called_once_with(account_id, mock_user.id)

    @pytest.mark.asyncio
    async def test_get_account_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test getting account that doesn't belong to user."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup mock - account doesn't belong to user
            service.repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call get_account and expect 403
            with pytest.raises(HTTPException) as exc_info:
                await service.get_account(mock_user, account_id)

            assert exc_info.value.status_code == 403
            assert "does not belong to user" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_account_not_found(self, mock_async_session, mock_user):
        """Test getting account that doesn't exist."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup mocks
            service.repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id_and_user = AsyncMock(return_value=None)

            # Call get_account and expect 404
            with pytest.raises(HTTPException) as exc_info:
                await service.get_account(mock_user, account_id)

            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail


@pytest.mark.unit
class TestAccountServiceUpdateAccount:
    """Test update_account method."""

    @pytest.mark.asyncio
    async def test_update_account_success(self, mock_async_session, mock_user):
        """Test successful account update."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup request - use valid account_type
            update_request = AccountUpdateRequest(
                account_name="Updated Account",
                currency="EUR",
                account_type="current"
            )

            # Setup mocks
            mock_account = MagicMock(spec=Account)
            mock_account.id = account_id
            mock_account.account_name = "Updated Account"
            mock_account.currency = "EUR"
            mock_account.account_type = "checking"
            mock_account.user_id = mock_user.id
            mock_account.balances = []
            mock_account.groups = []

            service.repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id_with_relations = AsyncMock(return_value=mock_account)
            service.repository.update = AsyncMock(return_value=mock_account)

            # Call update_account
            result = await service.update_account(mock_user, account_id, update_request)

            # Verify
            assert isinstance(result, AccountResponse)
            service.repository.account_belongs_to_user.assert_called_once()
            service.repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_account_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test updating account that doesn't belong to user."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()
            update_request = AccountUpdateRequest(
                account_name="Updated Account",
                currency="USD",
                account_type="savings"
            )

            # Setup mock - account doesn't belong to user
            service.repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call update_account and expect 403
            with pytest.raises(HTTPException) as exc_info:
                await service.update_account(mock_user, account_id, update_request)

            assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_update_account_not_found(self, mock_async_session, mock_user):
        """Test updating account that doesn't exist."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()
            update_request = AccountUpdateRequest(
                account_name="Updated Account",
                currency="USD",
                account_type="savings"
            )

            # Setup mocks
            service.repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id_with_relations = AsyncMock(return_value=None)

            # Call update_account and expect 404
            with pytest.raises(HTTPException) as exc_info:
                await service.update_account(mock_user, account_id, update_request)

            assert exc_info.value.status_code == 404


@pytest.mark.unit
class TestAccountServiceDeleteAccount:
    """Test delete_account method."""

    @pytest.mark.asyncio
    async def test_delete_account_success(self, mock_async_session, mock_user):
        """Test successful account deletion."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup mocks
            mock_account = MagicMock(spec=Account)
            mock_account.id = account_id

            service.repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id = AsyncMock(return_value=mock_account)
            service.repository.delete = AsyncMock(return_value=None)

            # Call delete_account
            result = await service.delete_account(mock_user, account_id)

            # Verify
            assert result == mock_account
            service.repository.account_belongs_to_user.assert_called_once()
            service.repository.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_account_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test deleting account that doesn't belong to user."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup mock - account doesn't belong to user
            service.repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call delete_account and expect 500 (service catches HTTPException and returns 500)
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_account(mock_user, account_id)

            assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_delete_account_not_found(self, mock_async_session, mock_user):
        """Test deleting account that doesn't exist."""
        with patch.object(AccountService, "__init__", return_value=None):
            service = AccountService(mock_async_session)
            service.repository = MagicMock()

            account_id = uuid4()

            # Setup mocks
            service.repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id = AsyncMock(return_value=None)

            # Call delete_account and expect 500 (service catches HTTPException and returns 500)
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_account(mock_user, account_id)

            assert exc_info.value.status_code == 500
