"""
Unit tests for base_repository.py
Tests the GenericRepository class that provides basic CRUD operations.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, call
from uuid import uuid4

from nw_tracker.repositories.base_repository import GenericRepository
from nw_tracker.models.models import Account


@pytest.mark.unit
class TestGenericRepositoryInit:
    """Test repository initialization."""

    def test_init_stores_session_and_model(self, mock_async_session):
        """Test that init stores session and model_class."""
        repo = GenericRepository(mock_async_session, Account)

        assert repo.session == mock_async_session
        assert repo.model_class == Account


@pytest.mark.unit
class TestGenericRepositoryGetById:
    """Test get_by_id method."""

    @pytest.mark.asyncio
    async def test_get_by_id_found(self, mock_async_session, mock_account, mock_db_result):
        """Test getting entity by ID when it exists."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_account])

        # Create repository and test
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.get_by_id(mock_account.id)

        # Verify
        mock_async_session.execute.assert_called_once()
        assert result == mock_account

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, mock_async_session, mock_db_result):
        """Test getting entity by ID when it doesn't exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.get_by_id(uuid4())

        # Verify
        assert result is None


@pytest.mark.unit
class TestGenericRepositoryGetAll:
    """Test get_all method."""

    @pytest.mark.asyncio
    async def test_get_all_returns_list(self, mock_async_session, mock_account_list, mock_db_result):
        """Test getting all entities."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result(mock_account_list)

        # Create repository and test
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.get_all()

        # Verify
        assert result == mock_account_list
        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_get_all_empty(self, mock_async_session, mock_db_result):
        """Test getting all entities when none exist."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.get_all()

        # Verify
        assert result == []


@pytest.mark.unit
class TestGenericRepositoryCreate:
    """Test create method."""

    @pytest.mark.asyncio
    async def test_create_entity(self, mock_async_session, mock_account):
        """Test creating a new entity."""
        # Create repository
        repo = GenericRepository(mock_async_session, Account)

        # Create entity
        result = await repo.create(mock_account)

        # Verify session methods were called
        mock_async_session.add.assert_called_once_with(mock_account)
        mock_async_session.commit.assert_called_once()
        mock_async_session.refresh.assert_called_once_with(mock_account)
        assert result == mock_account


@pytest.mark.unit
class TestGenericRepositoryUpdate:
    """Test update method."""

    @pytest.mark.asyncio
    async def test_update_entity(self, mock_async_session, mock_account):
        """Test updating an entity."""
        # Create repository
        repo = GenericRepository(mock_async_session, Account)

        # Update entity
        result = await repo.update(mock_account)

        # Verify session methods were called
        mock_async_session.add.assert_called_once_with(mock_account)
        mock_async_session.commit.assert_called_once()
        mock_async_session.refresh.assert_called_once_with(mock_account)
        assert result == mock_account


@pytest.mark.unit
class TestGenericRepositoryDelete:
    """Test delete methods."""

    @pytest.mark.asyncio
    async def test_delete_entity(self, mock_async_session, mock_account):
        """Test deleting an entity object."""
        # Create repository
        repo = GenericRepository(mock_async_session, Account)

        # Delete entity
        await repo.delete(mock_account)

        # Verify
        mock_async_session.delete.assert_called_once_with(mock_account)
        mock_async_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_by_id_success(self, mock_async_session, mock_account, mock_db_result):
        """Test deleting entity by ID when it exists."""
        # Setup mock for get_by_id
        mock_async_session.execute.return_value = mock_db_result([mock_account])

        # Create repository and delete
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.delete_by_id(mock_account.id)

        # Verify
        assert result is True
        mock_async_session.delete.assert_called_once()
        mock_async_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_by_id_not_found(self, mock_async_session, mock_db_result):
        """Test deleting entity by ID when it doesn't exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and delete
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.delete_by_id(uuid4())

        # Verify
        assert result is False
        # Should not call delete if entity not found
        mock_async_session.delete.assert_not_called()


@pytest.mark.unit
class TestGenericRepositoryExists:
    """Test exists_by_id method."""

    @pytest.mark.asyncio
    async def test_exists_by_id_true(self, mock_async_session, mock_account, mock_db_result):
        """Test exists check when entity exists."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_account])

        # Create repository and test
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.exists_by_id(mock_account.id)

        # Verify
        assert result is True

    @pytest.mark.asyncio
    async def test_exists_by_id_false(self, mock_async_session, mock_db_result):
        """Test exists check when entity doesn't exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = GenericRepository(mock_async_session, Account)
        result = await repo.exists_by_id(uuid4())

        # Verify
        assert result is False
