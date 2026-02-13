"""
Unit tests for account_repository.py
Tests the AccountRepository class with account-specific queries.
"""
import pytest
from unittest.mock import AsyncMock

from nw_tracker.repositories.account_repository import AccountRepository
from nw_tracker.models.models import Account


@pytest.mark.unit
class TestAccountRepositoryInit:
    """Test AccountRepository initialization."""

    def test_init(self, mock_async_session):
        """Test that AccountRepository is properly initialized."""
        repo = AccountRepository(mock_async_session)

        assert repo.session == mock_async_session
        assert repo.model_class == Account


@pytest.mark.unit
class TestAccountRepositoryGetByIdAndUser:
    """Test get_by_id_and_user method."""

    @pytest.mark.asyncio
    async def test_get_by_id_and_user_found(self, mock_async_session, mock_account, mock_db_result):
        """Test getting account by ID and user ID when found."""
        # Setup mock - account with empty lists for relationships
        mock_account.balances = []
        mock_account.groups = []
        mock_async_session.execute.return_value = mock_db_result([mock_account])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.get_by_id_and_user(mock_account.id, mock_account.user_id)

        # Verify
        mock_async_session.execute.assert_called_once()
        assert result == mock_account

    @pytest.mark.asyncio
    async def test_get_by_id_and_user_not_found(self, mock_async_session, mock_db_result):
        """Test getting account by ID and user ID when not found."""
        from uuid import uuid4

        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.get_by_id_and_user(uuid4(), uuid4())

        # Verify
        assert result is None


@pytest.mark.unit
class TestAccountRepositoryGetAllForUser:
    """Test get_all_for_user method."""

    @pytest.mark.asyncio
    async def test_get_all_for_user_returns_list(self, mock_async_session, mock_account_list, mock_db_result):
        """Test getting all accounts for a user."""
        # Setup accounts with empty relationships
        for account in mock_account_list:
            account.balances = []
            account.groups = []

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result(mock_account_list)

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.get_all_for_user(mock_account_list[0].user_id)

        # Verify
        assert result == mock_account_list
        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_get_all_for_user_empty(self, mock_async_session, mock_db_result):
        """Test getting all accounts when user has none."""
        from uuid import uuid4

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.get_all_for_user(uuid4())

        # Verify
        assert result == []


@pytest.mark.unit
class TestAccountRepositoryBelongsToUser:
    """Test account_belongs_to_user method."""

    @pytest.mark.asyncio
    async def test_account_belongs_to_user_true(self, mock_async_session, mock_account, mock_db_result):
        """Test checking if account belongs to user when it does."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_account])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.account_belongs_to_user(mock_account.id, mock_account.user_id)

        # Verify
        assert result is True

    @pytest.mark.asyncio
    async def test_account_belongs_to_user_false(self, mock_async_session, mock_db_result):
        """Test checking if account belongs to user when it doesn't."""
        from uuid import uuid4

        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.account_belongs_to_user(uuid4(), uuid4())

        # Verify
        assert result is False


@pytest.mark.unit
class TestAccountRepositoryGetByIdWithRelations:
    """Test get_by_id_with_relations method."""

    @pytest.mark.asyncio
    async def test_get_by_id_with_relations_found(self, mock_async_session, mock_account, mock_db_result):
        """Test getting account with relationships when found."""
        # Setup account with relationships
        mock_account.balances = []
        mock_account.groups = []
        mock_async_session.execute.return_value = mock_db_result([mock_account])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.get_by_id_with_relations(mock_account.id)

        # Verify
        assert result == mock_account

    @pytest.mark.asyncio
    async def test_get_by_id_with_relations_not_found(self, mock_async_session, mock_db_result):
        """Test getting account with relationships when not found."""
        from uuid import uuid4

        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = AccountRepository(mock_async_session)
        result = await repo.get_by_id_with_relations(uuid4())

        # Verify
        assert result is None
