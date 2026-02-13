"""
Unit tests for balance_repository.py
Tests the BalanceRepository class.
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from nw_tracker.repositories.balance_repository import BalanceRepository
from nw_tracker.models.models import Balance


@pytest.mark.unit
class TestBalanceRepositoryInit:
    """Test BalanceRepository initialization."""

    def test_init(self, mock_async_session):
        """Test that BalanceRepository is properly initialized."""
        repo = BalanceRepository(mock_async_session)

        assert repo.session == mock_async_session
        assert repo.model_class == Balance


@pytest.mark.unit
class TestBalanceRepositoryGetAllByAccountId:
    """Test get_all_balances_by_account_id method."""

    @pytest.mark.asyncio
    async def test_get_all_balances_by_account_id(self, mock_async_session, mock_balance_list, mock_db_result):
        """Test getting all balances for an account."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result(mock_balance_list)

        # Create repository and test
        repo = BalanceRepository(mock_async_session)
        result = await repo.get_all_balances_by_account_id(str(uuid4()))

        # Verify
        assert result == mock_balance_list
        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_get_all_balances_by_account_id_empty(self, mock_async_session, mock_db_result):
        """Test getting all balances when account has none."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = BalanceRepository(mock_async_session)
        result = await repo.get_all_balances_by_account_id(str(uuid4()))

        # Verify
        assert result == []


@pytest.mark.unit
class TestBalanceRepositoryGetLatestBalance:
    """Test get_latest_balance_by_account_id method."""

    @pytest.mark.asyncio
    async def test_get_latest_balance_by_account_id(self, mock_async_session, mock_balance, mock_db_result):
        """Test getting latest balance for an account."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_balance])

        # Create repository and test
        repo = BalanceRepository(mock_async_session)
        result = await repo.get_latest_balance_by_account_id(str(uuid4()))

        # Verify
        assert result == mock_balance

    @pytest.mark.asyncio
    async def test_get_latest_balance_by_account_id_not_found(self, mock_async_session, mock_db_result):
        """Test getting latest balance when none exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = BalanceRepository(mock_async_session)
        result = await repo.get_latest_balance_by_account_id(str(uuid4()))

        # Verify
        assert result is None
