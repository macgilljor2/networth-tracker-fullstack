"""
Unit tests for account_group_repository.py
Tests the AccountGroupRepository class.
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from nw_tracker.repositories.account_group_repository import AccountGroupRepository
from nw_tracker.models.models import AccountGroup


@pytest.mark.unit
class TestAccountGroupRepositoryInit:
    """Test AccountGroupRepository initialization."""

    def test_init(self, mock_async_session):
        """Test that AccountGroupRepository is properly initialized."""
        repo = AccountGroupRepository(mock_async_session)

        assert repo.session == mock_async_session
        assert repo.model_class == AccountGroup


@pytest.mark.unit
class TestAccountGroupRepositoryGetByName:
    """Test get_account_group_by_name method."""

    @pytest.mark.asyncio
    async def test_get_by_name_found(self, mock_async_session, mock_account_group, mock_db_result):
        """Test getting account group by name when found."""
        # Setup account group with empty accounts list
        mock_account_group.accounts = []
        mock_async_session.execute.return_value = mock_db_result([mock_account_group])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_account_group_by_name(mock_account_group.name)

        # Verify
        assert result == mock_account_group

    @pytest.mark.asyncio
    async def test_get_by_name_not_found(self, mock_async_session, mock_db_result):
        """Test getting account group by name when not found."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_account_group_by_name("nonexistent")

        # Verify
        assert result is None


@pytest.mark.unit
class TestAccountGroupRepositoryGetAllForUser:
    """Test get_all_for_user method."""

    @pytest.mark.asyncio
    async def test_get_all_for_user_returns_list(self, mock_async_session, mock_account_group, mock_db_result):
        """Test getting all account groups for user."""
        # Setup account group with empty accounts
        mock_account_group.accounts = []
        groups = [mock_account_group]
        mock_async_session.execute.return_value = mock_db_result(groups)

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_all_for_user(mock_account_group.user_id)

        # Verify
        assert result == groups
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_all_for_user_empty(self, mock_async_session, mock_db_result):
        """Test getting all account groups when user has none."""
        # Setup mock to return empty list
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_all_for_user(uuid4())

        # Verify
        assert result == []


@pytest.mark.unit
class TestAccountGroupRepositoryGetByIdAndUser:
    """Test get_by_id_and_user method."""

    @pytest.mark.asyncio
    async def test_get_by_id_and_user_found(self, mock_async_session, mock_account_group, mock_db_result):
        """Test getting account group by ID and user ID when found."""
        # Setup account group with empty accounts
        mock_account_group.accounts = []
        mock_async_session.execute.return_value = mock_db_result([mock_account_group])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_by_id_and_user(
            mock_account_group.id, mock_account_group.user_id
        )

        # Verify
        assert result == mock_account_group

    @pytest.mark.asyncio
    async def test_get_by_id_and_user_not_found(self, mock_async_session, mock_db_result):
        """Test getting account group by ID and user ID when not found."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_by_id_and_user(uuid4(), uuid4())

        # Verify
        assert result is None


@pytest.mark.unit
class TestAccountGroupRepositoryGetByIdWithAccounts:
    """Test get_by_id_with_accounts method."""

    @pytest.mark.asyncio
    async def test_get_by_id_with_accounts_found(self, mock_async_session, mock_account_group, mock_db_result):
        """Test getting account group with accounts when found."""
        # Setup account group with empty accounts list
        mock_account_group.accounts = []
        mock_async_session.execute.return_value = mock_db_result([mock_account_group])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_by_id_with_accounts(mock_account_group.id)

        # Verify
        assert result == mock_account_group

    @pytest.mark.asyncio
    async def test_get_by_id_with_accounts_not_found(self, mock_async_session, mock_db_result):
        """Test getting account group with accounts when not found."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountGroupRepository(mock_async_session)
        result = await repo.get_by_id_with_accounts(uuid4())

        # Verify
        assert result is None
