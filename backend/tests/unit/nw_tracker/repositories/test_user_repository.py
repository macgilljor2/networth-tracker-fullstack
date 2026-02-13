"""
Unit tests for user_repository.py
Tests the UserRepository class with user-specific queries.
"""
import pytest
from unittest.mock import AsyncMock

from nw_tracker.repositories.user_repository import UserRepository
from nw_tracker.models.models import User


@pytest.mark.unit
class TestUserRepositoryInit:
    """Test UserRepository initialization."""

    def test_init(self, mock_async_session):
        """Test that UserRepository is properly initialized."""
        repo = UserRepository(mock_async_session)

        assert repo.session == mock_async_session
        assert repo.model_class == User


@pytest.mark.unit
class TestUserRepositoryGetByUsername:
    """Test get_user_by_username method."""

    @pytest.mark.asyncio
    async def test_get_user_by_username_found(self, mock_async_session, mock_user, mock_db_result):
        """Test getting user by username when found."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_user])

        # Create repository and test
        repo = UserRepository(mock_async_session)
        result = await repo.get_user_by_username(mock_user.username)

        # Verify
        mock_async_session.execute.assert_called_once()
        assert result == mock_user

    @pytest.mark.asyncio
    async def test_get_user_by_username_not_found(self, mock_async_session, mock_db_result):
        """Test getting user by username when not found."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = UserRepository(mock_async_session)
        result = await repo.get_user_by_username("nonexistent")

        # Verify
        assert result is None


@pytest.mark.unit
class TestUserRepositoryGetByEmail:
    """Test get_by_email method."""

    @pytest.mark.asyncio
    async def test_get_by_email_found(self, mock_async_session, mock_user, mock_db_result):
        """Test getting user by email when found."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_user])

        # Create repository and test
        repo = UserRepository(mock_async_session)
        result = await repo.get_by_email(mock_user.email)

        # Verify
        mock_async_session.execute.assert_called_once()
        assert result == mock_user

    @pytest.mark.asyncio
    async def test_get_by_email_not_found(self, mock_async_session, mock_db_result):
        """Test getting user by email when not found."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = UserRepository(mock_async_session)
        result = await repo.get_by_email("nonexistent@example.com")

        # Verify
        assert result is None


@pytest.mark.unit
class TestUserRepositoryExistsByName:
    """Test exists_by_name method."""

    @pytest.mark.asyncio
    async def test_exists_by_name_true(self, mock_async_session, mock_user, mock_db_result):
        """Test exists check when user exists."""
        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([mock_user])

        # Create repository and test
        repo = UserRepository(mock_async_session)
        result = await repo.exists_by_name(mock_user.username)

        # Verify
        assert result is True

    @pytest.mark.asyncio
    async def test_exists_by_name_false(self, mock_async_session, mock_db_result):
        """Test exists check when user doesn't exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = UserRepository(mock_async_session)
        result = await repo.exists_by_name("nonexistent")

        # Verify
        assert result is False
