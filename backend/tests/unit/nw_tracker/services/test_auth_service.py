"""
Unit tests for auth_service.py
Tests the AuthService class with mocked dependencies.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta
from uuid import uuid4
from fastapi import HTTPException

from nw_tracker.services.auth_service import AuthService
from nw_tracker.models.models import User


@pytest.mark.unit
class TestAuthServiceInit:
    """Test AuthService initialization."""

    def test_init(self, mock_async_session):
        """Test that AuthService is properly initialized."""
        service = AuthService(mock_async_session)

        assert service.session == mock_async_session


@pytest.mark.unit
class TestAuthServiceRegisterUser:
    """Test register_user method."""

    @pytest.mark.asyncio
    async def test_register_user_success(self, mock_async_session, mock_user, sample_user_dict):
        """Test successful user registration."""
        # Mock user repository
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Mock user doesn't exist
            service.user_repository.get_by_email = AsyncMock(return_value=None)
            service.user_repository.exists_by_name = AsyncMock(return_value=False)
            service.user_repository.create = AsyncMock(return_value=mock_user)

            # Call register
            result = await service.register_user(
                username=sample_user_dict["username"],
                email=sample_user_dict["email"],
                password=sample_user_dict["password"]
            )

            # Verify
            assert result == mock_user
            service.user_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_user_duplicate_email(self, mock_async_session, mock_user):
        """Test registration with duplicate email."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # User already exists by email
            service.user_repository.get_by_email = AsyncMock(return_value=mock_user)

            # Attempt to register
            with pytest.raises(HTTPException) as exc_info:
                await service.register_user("testuser", "test@example.com", "password")

            assert exc_info.value.status_code == 400
            assert "already registered" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_register_user_duplicate_username(self, mock_async_session):
        """Test registration with duplicate username."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Username taken
            service.user_repository.get_by_email = AsyncMock(return_value=None)
            service.user_repository.exists_by_name = AsyncMock(return_value=True)

            # Attempt to register
            with pytest.raises(HTTPException) as exc_info:
                await service.register_user("testuser", "test@example.com", "password")

            assert exc_info.value.status_code == 400
            assert "already taken" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_register_user_password_too_short(self, mock_async_session):
        """Test registration with password too short."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Setup mock for password length check
            with patch("nw_tracker.services.auth_service.settings") as mock_settings:
                mock_settings.password_min_length = 10

                service.user_repository.get_by_email = AsyncMock(return_value=None)
                service.user_repository.exists_by_name = AsyncMock(return_value=False)

                # Attempt to register with short password
                with pytest.raises(HTTPException) as exc_info:
                    await service.register_user("testuser", "test@example.com", "short")

                assert exc_info.value.status_code == 400
                assert "10" in exc_info.value.detail


@pytest.mark.unit
class TestAuthServiceLogin:
    """Test login method."""

    @pytest.mark.asyncio
    async def test_login_success(self, mock_async_session, mock_user):
        """Test successful login."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()
            service.refresh_token_repository = MagicMock()

            # Setup mocks
            service.user_repository.get_by_email = AsyncMock(return_value=mock_user)
            service.user_repository.get_by_id = AsyncMock(return_value=mock_user)
            service.user_repository.update = AsyncMock(return_value=mock_user)
            service.refresh_token_repository.create_refresh_token = AsyncMock(return_value=mock_user)
            service.user_repository.get_by_id = AsyncMock(return_value=mock_user)
            service.user_repository.update = AsyncMock(return_value=mock_user)

            with patch("nw_tracker.services.auth_service.verify_password") as mock_verify, \
                 patch("nw_tracker.services.auth_service.create_access_token") as mock_create_access, \
                 patch("nw_tracker.services.auth_service.create_refresh_token") as mock_create_refresh, \
                 patch("nw_tracker.services.auth_service.datetime") as mock_datetime:

                mock_verify.return_value = True
                mock_create_access.return_value = "access_token"
                mock_create_refresh.return_value = "refresh_token"
                mock_datetime.utcnow.return_value = datetime.utcnow()

                # Call login
                access_token, refresh_token = await service.login(
                    email="test@example.com",
                    password="password"
                )

            # Verify
            assert access_token == "access_token"
            assert refresh_token == "refresh_token"
            service.user_repository.update.assert_called_once_with(mock_user)

    @pytest.mark.asyncio
    async def test_login_user_not_found(self, mock_async_session):
        """Test login with non-existent email."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # User not found
            service.user_repository.get_by_email = AsyncMock(return_value=None)

            # Attempt login
            with pytest.raises(HTTPException) as exc_info:
                await service.login("nonexistent@example.com", "password")

            assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, mock_async_session, mock_user):
        """Test login with inactive user."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Inactive user
            mock_user.is_active = False
            service.user_repository.get_by_email = AsyncMock(return_value=mock_user)

            # Attempt login
            with pytest.raises(HTTPException) as exc_info:
                await service.login("test@example.com", "password")

            assert exc_info.value.status_code == 403
            assert "inactive" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, mock_async_session, mock_user):
        """Test login with wrong password."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Wrong password
            service.user_repository.get_by_email = AsyncMock(return_value=mock_user)

            with patch("nw_tracker.services.auth_service.verify_password") as mock_verify:
                mock_verify.return_value = False

                # Attempt login
                with pytest.raises(HTTPException) as exc_info:
                    await service.login("test@example.com", "wrong_password")

                assert exc_info.value.status_code == 401


@pytest.mark.unit
class TestAuthServiceRefreshToken:
    """Test refresh_access_token method."""

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, mock_async_session, mock_user):
        """Test successful token refresh."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()
            service.refresh_token_repository = MagicMock()

            # Setup mocks
            token_obj = MagicMock()
            token_obj.revoked = False
            token_obj.expires_at = datetime.utcnow() + timedelta(days=1)

            service.refresh_token_repository.get_valid_token = AsyncMock(return_value=token_obj)
            service.user_repository.get_by_id = AsyncMock(return_value=mock_user)

            with patch("nw_tracker.services.auth_service.decode_refresh_token") as mock_decode, \
                 patch("nw_tracker.services.auth_service.create_access_token") as mock_create_access:

                # Mock payload
                mock_decode.return_value = {"sub": str(mock_user.id)}
                mock_create_access.return_value = "new_access_token"

                # Call refresh
                result = await service.refresh_access_token("valid_token")

            # Verify
            assert result == "new_access_token"

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, mock_async_session):
        """Test refresh with invalid token."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.refresh_token_repository = MagicMock()

            # Token not valid
            service.refresh_token_repository.get_valid_token = AsyncMock(return_value=None)

            # Attempt refresh
            with pytest.raises(HTTPException) as exc_info:
                await service.refresh_access_token("invalid_token")

            assert exc_info.value.status_code == 401
            assert "Invalid or expired" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_refresh_token_expired(self, mock_async_session):
        """Test refresh with expired token."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.refresh_token_repository = MagicMock()

            # Expired token
            token_obj = MagicMock()
            token_obj.revoked = False
            token_obj.expires_at = datetime.utcnow() - timedelta(days=1)

            service.refresh_token_repository.get_valid_token = AsyncMock(return_value=token_obj)

            # Attempt refresh
            with pytest.raises(HTTPException) as exc_info:
                await service.refresh_access_token("expired_token")

            assert exc_info.value.status_code == 401


@pytest.mark.unit
class TestAuthServiceLogout:
    """Test logout method."""

    @pytest.mark.asyncio
    async def test_logout_success(self, mock_async_session):
        """Test successful logout."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.refresh_token_repository = MagicMock()

            # Token exists and can be revoked
            service.refresh_token_repository.revoke_token = AsyncMock(return_value=True)

            # Call logout
            await service.logout("valid_token")

            # Verify
            service.refresh_token_repository.revoke_token.assert_called_once_with("valid_token")

    @pytest.mark.asyncio
    async def test_logout_token_not_found(self, mock_async_session):
        """Test logout with non-existent token."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.refresh_token_repository = MagicMock()

            # Token doesn't exist
            service.refresh_token_repository.revoke_token = AsyncMock(return_value=False)

            # Call logout (should not raise exception, just log warning)
            await service.logout("nonexistent_token")

            # Verify it was attempted
            service.refresh_token_repository.revoke_token.assert_called_once()


@pytest.mark.unit
class TestAuthServiceGetCurrentUser:
    """Test get_current_user_from_token method."""

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_success(self, mock_async_session, mock_user):
        """Test getting user from valid token."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Setup mocks
            with patch("nw_tracker.services.auth_service.decode_access_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": str(mock_user.id),
                    "email": mock_user.email
                }

                service.user_repository.get_by_id = AsyncMock(return_value=mock_user)

                # Call get_current_user_from_token
                result = await service.get_current_user_from_token("valid_token")

            # Verify
            assert result == mock_user
            service.user_repository.get_by_id.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_invalid(self, mock_async_session):
        """Test getting user with invalid token."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)

            # Invalid token
            with patch("nw_tracker.services.auth_service.decode_access_token") as mock_decode:
                mock_decode.return_value = None

                # Attempt to get user
                with pytest.raises(HTTPException) as exc_info:
                    await service.get_current_user_from_token("invalid_token")

                assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_user_not_found(self, mock_async_session, mock_user):
        """Test getting user when user doesn't exist."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Token decodes but user doesn't exist
            with patch("nw_tracker.services.auth_service.decode_access_token") as mock_decode:
                mock_decode.return_value = {"sub": str(mock_user.id)}

                service.user_repository.get_by_id = AsyncMock(return_value=None)

                # Attempt to get user
                with pytest.raises(HTTPException) as exc_info:
                    await service.get_current_user_from_token("token")

                assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_from_token_inactive_user(self, mock_async_session, mock_user):
        """Test getting current user when user is inactive."""
        with patch.object(AuthService, "__init__", return_value=None):
            service = AuthService(mock_async_session)
            service.user_repository = MagicMock()

            # Inactive user
            mock_user.is_active = False
            with patch("nw_tracker.services.auth_service.decode_access_token") as mock_decode:
                mock_decode.return_value = {"sub": str(mock_user.id)}

                service.user_repository.get_by_id = AsyncMock(return_value=mock_user)

                # Attempt to get user
                with pytest.raises(HTTPException) as exc_info:
                    await service.get_current_user_from_token("token")

                assert exc_info.value.status_code == 403
                assert "Inactive" in exc_info.value.detail
