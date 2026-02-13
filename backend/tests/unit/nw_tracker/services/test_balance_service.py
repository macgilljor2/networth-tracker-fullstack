"""
Unit tests for balance_service.py
Tests the BalanceService class with mocked dependencies.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import date
from fastapi import HTTPException

from nw_tracker.services.balance_service import BalanceService
from nw_tracker.models.models import Balance, User
from nw_tracker.models.request_response_models import (
    BalanceCreateRequest,
    BalanceUpdateRequest,
    BalanceResponse
)


@pytest.mark.unit
class TestBalanceServiceInit:
    """Test BalanceService initialization."""

    def test_init(self, mock_async_session):
        """Test that BalanceService is properly initialized."""
        service = BalanceService(mock_async_session)

        assert service.repository is not None
        assert service.account_repository is not None


@pytest.mark.unit
class TestBalanceServiceCreateBalance:
    """Test create_balance method."""

    @pytest.mark.asyncio
    async def test_create_balance_success(self, mock_async_session, mock_user):
        """Test successful balance creation."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_data = {
                "amount": 1000.00,
                "date": date.today()
            }

            # Setup mocks
            mock_balance = MagicMock(spec=Balance)
            mock_balance.id = uuid4()
            mock_balance.amount = 1000.00
            mock_balance.date = date.today()
            mock_balance.account_uuid = account_id
            mock_balance.created_at = "2024-01-01"
            mock_balance.updated_at = "2024-01-01"

            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.create = AsyncMock(return_value=mock_balance)

            # Call create_balance
            result = await service.create_balance(mock_user, account_id, balance_data)

            # Verify
            assert isinstance(result, BalanceResponse)
            assert result.amount == 1000.00
            service.account_repository.account_belongs_to_user.assert_called_once_with(account_id, mock_user.id)
            service.repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_balance_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test creating balance for account that doesn't belong to user."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_data = {"amount": 1000.00, "date": date.today()}

            # Setup mock - account doesn't belong to user
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call create_balance and expect 403
            with pytest.raises(HTTPException) as exc_info:
                await service.create_balance(mock_user, account_id, balance_data)

            assert exc_info.value.status_code == 403
            assert "does not belong to user" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_create_balance_server_error(self, mock_async_session, mock_user):
        """Test balance creation with server error."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_data = {"amount": 1000.00, "date": date.today()}

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.create = AsyncMock(side_effect=Exception("Database error"))

            # Call create_balance and expect 500
            with pytest.raises(HTTPException) as exc_info:
                await service.create_balance(mock_user, account_id, balance_data)

            assert exc_info.value.status_code == 500


@pytest.mark.unit
class TestBalanceServiceGetAllBalancesForAccount:
    """Test get_all_balances_for_account method."""

    @pytest.mark.asyncio
    async def test_get_all_balances_returns_list(self, mock_async_session, mock_user):
        """Test getting all balances for account."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()

            # Setup mocks
            mock_balance = MagicMock(spec=Balance)
            mock_balance.id = uuid4()
            mock_balance.amount = 1000.00
            mock_balance.date = date.today()
            mock_balance.account_uuid = account_id
            mock_balance.created_at = "2024-01-01"
            mock_balance.updated_at = "2024-01-01"

            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_all_balances_by_account_id = AsyncMock(return_value=[mock_balance])

            # Call get_all_balances_for_account
            result = await service.get_all_balances_for_account(mock_user, account_id)

            # Verify
            assert isinstance(result, list)
            assert len(result) == 1
            assert isinstance(result[0], BalanceResponse)
            service.account_repository.account_belongs_to_user.assert_called_once()
            service.repository.get_all_balances_by_account_id.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_balances_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test getting balances for account that doesn't belong to user."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()

            # Setup mock - account doesn't belong to user
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call get_all_balances_for_account and expect 500 (service catches HTTPException)
            with pytest.raises(HTTPException) as exc_info:
                await service.get_all_balances_for_account(mock_user, account_id)

            assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_get_all_balances_empty(self, mock_async_session, mock_user):
        """Test getting all balances when account has none."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_all_balances_by_account_id = AsyncMock(return_value=[])

            # Call get_all_balances_for_account
            result = await service.get_all_balances_for_account(mock_user, account_id)

            # Verify
            assert result == []


@pytest.mark.unit
class TestBalanceServiceGetBalance:
    """Test get_balance method."""

    @pytest.mark.asyncio
    async def test_get_balance_success(self, mock_async_session, mock_user):
        """Test getting balance by ID."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mocks
            mock_balance = MagicMock(spec=Balance)
            mock_balance.id = balance_id
            mock_balance.amount = 1000.00
            mock_balance.date = date.today()
            mock_balance.account_uuid = account_id
            mock_balance.created_at = "2024-01-01"
            mock_balance.updated_at = "2024-01-01"

            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id = AsyncMock(return_value=mock_balance)

            # Call get_balance
            result = await service.get_balance(mock_user, account_id, balance_id)

            # Verify
            assert isinstance(result, BalanceResponse)
            service.account_repository.account_belongs_to_user.assert_called_once()
            service.repository.get_by_id.assert_called_once_with(balance_id)

    @pytest.mark.asyncio
    async def test_get_balance_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test getting balance for account that doesn't belong to user."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mock - account doesn't belong to user
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call get_balance and expect 500 (service catches HTTPException)
            with pytest.raises(HTTPException) as exc_info:
                await service.get_balance(mock_user, account_id, balance_id)

            assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_get_balance_not_found(self, mock_async_session, mock_user):
        """Test getting balance that doesn't exist."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id = AsyncMock(return_value=None)

            # Call get_balance and expect 500 (service catches HTTPException)
            with pytest.raises(HTTPException) as exc_info:
                await service.get_balance(mock_user, account_id, balance_id)

            assert exc_info.value.status_code == 500


@pytest.mark.unit
class TestBalanceServiceUpdateBalance:
    """Test update_balance method."""

    @pytest.mark.asyncio
    async def test_update_balance_success(self, mock_async_session, mock_user):
        """Test successful balance update."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup request
            update_request = BalanceUpdateRequest(
                amount=2000.00,
                date=date.today()
            )

            # Setup mocks
            mock_balance = MagicMock(spec=Balance)
            mock_balance.id = balance_id
            mock_balance.amount = 2000.00
            mock_balance.date = date.today()
            mock_balance.account_uuid = account_id

            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id = AsyncMock(return_value=mock_balance)
            service.repository.update = AsyncMock(return_value=mock_balance)

            # Call update_balance
            result = await service.update_balance(mock_user, account_id, balance_id, update_request)

            # Verify
            assert isinstance(result, BalanceResponse)
            service.account_repository.account_belongs_to_user.assert_called_once()
            service.repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_balance_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test updating balance for account that doesn't belong to user."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()
            update_request = BalanceUpdateRequest(amount=2000.00, date=date.today())

            # Setup mock - account doesn't belong to user
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call update_balance and expect 500 (service catches HTTPException)
            with pytest.raises(HTTPException) as exc_info:
                await service.update_balance(mock_user, account_id, balance_id, update_request)

            assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_update_balance_not_found(self, mock_async_session, mock_user):
        """Test updating balance that doesn't exist."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()
            update_request = BalanceUpdateRequest(amount=2000.00, date=date.today())

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.get_by_id = AsyncMock(return_value=None)

            # Call update_balance and expect 500 (service catches HTTPException)
            with pytest.raises(HTTPException) as exc_info:
                await service.update_balance(mock_user, account_id, balance_id, update_request)

            assert exc_info.value.status_code == 500


@pytest.mark.unit
class TestBalanceServiceDeleteBalance:
    """Test delete_balance method."""

    @pytest.mark.asyncio
    async def test_delete_balance_success(self, mock_async_session, mock_user):
        """Test successful balance deletion."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.exists_by_id = AsyncMock(return_value=True)
            service.repository.delete_by_id = AsyncMock(return_value=None)

            # Call delete_balance
            result = await service.delete_balance(mock_user, account_id, balance_id)

            # Verify
            assert result is True
            service.account_repository.account_belongs_to_user.assert_called_once()
            service.repository.exists_by_id.assert_called_once()
            service.repository.delete_by_id.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_balance_not_belongs_to_user(self, mock_async_session, mock_user):
        """Test deleting balance for account that doesn't belong to user."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mock - account doesn't belong to user
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=False)

            # Call delete_balance and expect 403
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_balance(mock_user, account_id, balance_id)

            assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_balance_not_found(self, mock_async_session, mock_user):
        """Test deleting balance that doesn't exist."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.exists_by_id = AsyncMock(return_value=False)

            # Call delete_balance and expect 404
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_balance(mock_user, account_id, balance_id)

            assert exc_info.value.status_code == 404
            assert "not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_delete_balance_server_error(self, mock_async_session, mock_user):
        """Test balance deletion with server error."""
        with patch.object(BalanceService, "__init__", return_value=None):
            service = BalanceService(mock_async_session)
            service.repository = MagicMock()
            service.account_repository = MagicMock()

            account_id = uuid4()
            balance_id = uuid4()

            # Setup mocks
            service.account_repository.account_belongs_to_user = AsyncMock(return_value=True)
            service.repository.exists_by_id = AsyncMock(return_value=True)
            service.repository.delete_by_id = AsyncMock(side_effect=Exception("Database error"))

            # Call delete_balance and expect 500
            with pytest.raises(HTTPException) as exc_info:
                await service.delete_balance(mock_user, account_id, balance_id)

            assert exc_info.value.status_code == 500
