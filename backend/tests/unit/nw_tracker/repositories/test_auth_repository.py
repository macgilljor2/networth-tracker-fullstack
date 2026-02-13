"""
Unit tests for auth_repository.py
Tests the RefreshTokenRepository class.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
from uuid import uuid4

from nw_tracker.repositories.auth_repository import RefreshTokenRepository
from nw_tracker.models.auth_models import RefreshToken


@pytest.mark.unit
class TestRefreshTokenRepositoryInit:
    """Test RefreshTokenRepository initialization."""

    def test_init(self, mock_async_session):
        """Test that RefreshTokenRepository is properly initialized."""
        repo = RefreshTokenRepository(mock_async_session)

        assert repo.session == mock_async_session


@pytest.mark.unit
class TestRefreshTokenRepositoryCreateToken:
    """Test create_refresh_token method."""

    @pytest.mark.asyncio
    async def test_create_refresh_token(self, mock_async_session, mock_user):
        """Test creating a new refresh token."""
        token_str = "test_token_string"
        expires_at = datetime.utcnow() + timedelta(days=7)

        # Create repository
        repo = RefreshTokenRepository(mock_async_session)

        # Create token
        result = await repo.create_refresh_token(token_str, mock_user.id, expires_at)

        # Verify
        assert result.token == token_str
        assert result.user_id == mock_user.id
        assert result.expires_at == expires_at
        assert result.revoked is False
        mock_async_session.add.assert_called_once()
        mock_async_session.commit.assert_called_once()


@pytest.mark.unit
class TestRefreshTokenRepositoryGetByToken:
    """Test get_by_token method."""

    @pytest.mark.asyncio
    async def test_get_by_token_found(self, mock_async_session, mock_user, mock_db_result):
        """Test getting token by token string when found."""
        # Create mock token
        token_obj = MagicMock(spec=RefreshToken)
        token_obj.id = uuid4()
        token_obj.token = "test_token"
        token_obj.user_id = mock_user.id
        token_obj.revoked = False

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([token_obj])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.get_by_token("test_token")

        # Verify
        assert result == token_obj

    @pytest.mark.asyncio
    async def test_get_by_token_not_found(self, mock_async_session, mock_db_result):
        """Test getting token by token string when not found."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.get_by_token("nonexistent_token")

        # Verify
        assert result is None


@pytest.mark.unit
class TestRefreshTokenRepositoryGetValidToken:
    """Test get_valid_token method."""

    @pytest.mark.asyncio
    async def test_get_valid_token_valid(self, mock_async_session, mock_user, mock_db_result):
        """Test getting valid token (not revoked, not expired)."""
        # Create mock token
        token_obj = MagicMock(spec=RefreshToken)
        token_obj.token = "valid_token"
        token_obj.user_id = mock_user.id
        token_obj.revoked = False
        token_obj.expires_at = datetime.utcnow() + timedelta(days=1)

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([token_obj])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.get_valid_token("valid_token")

        # Verify
        assert result == token_obj

    @pytest.mark.asyncio
    async def test_get_valid_token_revoked(self, mock_async_session, mock_user, mock_db_result):
        """Test getting valid token when it's revoked."""
        # Create mock revoked token
        token_obj = MagicMock(spec=RefreshToken)
        token_obj.revoked = True
        token_obj.expires_at = datetime.utcnow() + timedelta(days=1)

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([token_obj])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.get_valid_token("revoked_token")

        # Verify
        assert result is None

    @pytest.mark.asyncio
    async def test_get_valid_token_expired(self, mock_async_session, mock_user, mock_db_result):
        """Test getting valid token when it's expired."""
        # Create mock expired token
        token_obj = MagicMock(spec=RefreshToken)
        token_obj.revoked = False
        token_obj.expires_at = datetime.utcnow() - timedelta(days=1)

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([token_obj])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.get_valid_token("expired_token")

        # Verify
        assert result is None

    @pytest.mark.asyncio
    async def test_get_valid_token_not_found(self, mock_async_session, mock_db_result):
        """Test getting valid token when token doesn't exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.get_valid_token("nonexistent_token")

        # Verify
        assert result is None


@pytest.mark.unit
class TestRefreshTokenRepositoryRevokeToken:
    """Test revoke_token method."""

    @pytest.mark.asyncio
    async def test_revoke_token_success(self, mock_async_session, mock_db_result):
        """Test revoking an existing token."""
        # Create mock token
        token_obj = MagicMock(spec=RefreshToken)
        token_obj.revoked = False

        # Setup mock
        mock_async_session.execute.return_value = mock_db_result([token_obj])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.revoke_token("test_token")

        # Verify
        assert result is True
        assert token_obj.revoked is True
        mock_async_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_revoke_token_not_found(self, mock_async_session, mock_db_result):
        """Test revoking a token that doesn't exist."""
        # Setup mock to return None
        mock_async_session.execute.return_value = mock_db_result([])

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.revoke_token("nonexistent_token")

        # Verify
        assert result is False
        mock_async_session.commit.assert_not_called()


@pytest.mark.unit
class TestRefreshTokenRepositoryRevokeAllUserTokens:
    """Test revoke_all_user_tokens method."""

    @pytest.mark.asyncio
    async def test_revoke_all_user_tokens(self, mock_async_session, mock_user):
        """Test revoking all tokens for a user."""
        # Create mock tokens
        tokens = []
        for i in range(3):
            token = MagicMock(spec=RefreshToken)
            token.revoked = False
            tokens.append(token)

        # Setup mock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = tokens
        mock_async_session.execute.return_value = mock_result

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        await repo.revoke_all_user_tokens(mock_user.id)

        # Verify all tokens were revoked
        for token in tokens:
            assert token.revoked is True
        mock_async_session.commit.assert_called_once()


@pytest.mark.unit
class TestRefreshTokenRepositoryDeleteExpiredTokens:
    """Test delete_expired_tokens method."""

    @pytest.mark.asyncio
    async def test_delete_expired_tokens(self, mock_async_session):
        """Test deleting expired tokens."""
        # Create mock expired tokens
        tokens = []
        for i in range(3):
            token = MagicMock(spec=RefreshToken)
            tokens.append(token)

        # Setup mock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = tokens
        mock_async_session.execute.return_value = mock_result

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.delete_expired_tokens()

        # Verify
        assert result == 3
        # Verify all tokens were deleted
        assert mock_async_session.delete.call_count == 3
        mock_async_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_expired_tokens_empty(self, mock_async_session):
        """Test deleting expired tokens when none exist."""
        # Setup mock to return empty list
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_async_session.execute.return_value = mock_result

        # Create repository and test
        repo = RefreshTokenRepository(mock_async_session)
        result = await repo.delete_expired_tokens()

        # Verify
        assert result == 0
        mock_async_session.delete.assert_not_called()
