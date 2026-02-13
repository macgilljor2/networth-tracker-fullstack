"""
Integration tests for authentication endpoints.
Tests the actual API endpoints with SQLite database.
"""
import pytest
from uuid import uuid4


@pytest.mark.integration
class TestUserRegistration:
    """Test user registration endpoint."""

    async def test_register_user_success(self, test_client):
        """Test successful user registration."""
        unique_id = str(uuid4())[:8]
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"newuser_{unique_id}",
                "email": f"newuser_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["username"] == f"newuser_{unique_id}"
        assert data["email"] == f"newuser_{unique_id}@example.com"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    async def test_register_duplicate_email(self, test_client):
        """Test registration with duplicate email."""
        unique_id = str(uuid4())[:8]

        # First registration
        await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"user1_{unique_id}",
                "email": f"dup_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        # Duplicate email
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"user2_{unique_id}",
                "email": f"dup_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    async def test_register_duplicate_username(self, test_client):
        """Test registration with duplicate username."""
        unique_id = str(uuid4())[:8]

        # First registration
        await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"dupuser_{unique_id}",
                "email": f"user1_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        # Duplicate username
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"dupuser_{unique_id}",
                "email": f"user2_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        assert response.status_code == 400
        assert "already taken" in response.json()["detail"].lower()

    async def test_register_password_too_short(self, test_client):
        """Test registration with password too short."""
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "short",
            },
        )

        # Returns 422 (validation error) since password is too short for pydantic model
        assert response.status_code == 422

    async def test_register_invalid_email_format(self, test_client):
        """Test registration with invalid email format."""
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "notanemail",
                "password": "Password123!",
            },
        )

        assert response.status_code == 422  # Validation error

    async def test_register_missing_fields(self, test_client):
        """Test registration with missing required fields."""
        response = await test_client.post(
            "/api/v1/auth/register",
            json={"username": "testuser"},  # Missing email and password
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.integration
class TestUserLogin:
    """Test user login endpoint."""

    async def test_login_success(self, test_client):
        """Test successful login."""
        unique_id = str(uuid4())[:8]

        # Register user first
        await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"loginuser_{unique_id}",
                "email": f"login_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        # Login
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": f"login_{unique_id}@example.com", "password": "Password123!"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        assert isinstance(data["expires_in"], int)

    async def test_login_invalid_email(self, test_client):
        """Test login with non-existent email."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "Password123!"},
        )

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower() or "invalid" in response.json()["detail"].lower()

    async def test_login_invalid_password(self, test_client):
        """Test login with wrong password."""
        unique_id = str(uuid4())[:8]

        # Register user
        await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"testuser_{unique_id}",
                "email": f"test_{unique_id}@example.com",
                "password": "CorrectPassword123!",
            },
        )

        # Login with wrong password
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": f"test_{unique_id}@example.com", "password": "WrongPassword123!"},
        )

        assert response.status_code == 401

    async def test_login_missing_fields(self, test_client):
        """Test login with missing fields."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"},  # Missing password
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.integration
class TestTokenRefresh:
    """Test token refresh endpoint."""

    async def test_refresh_token_success(self, test_client):
        """Test successful token refresh."""
        unique_id = str(uuid4())[:8]

        # Register and login to get tokens
        await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"refreshuser_{unique_id}",
                "email": f"refresh_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": f"refresh_{unique_id}@example.com", "password": "Password123!"},
        )
        tokens = login_response.json()
        refresh_token = tokens["refresh_token"]

        # Refresh token
        response = await test_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_refresh_token_invalid(self, test_client):
        """Test refresh with invalid token."""
        response = await test_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"},
        )

        assert response.status_code == 401

    async def test_refresh_token_missing(self, test_client):
        """Test refresh without token."""
        response = await test_client.post(
            "/api/v1/auth/refresh",
            json={},  # Missing refresh_token
        )

        assert response.status_code == 422  # Validation error


@pytest.mark.integration
class TestUserLogout:
    """Test user logout endpoint."""

    async def test_logout_success(self, test_client):
        """Test successful logout."""
        unique_id = str(uuid4())[:8]

        # Register and login
        await test_client.post(
            "/api/v1/auth/register",
            json={
                "username": f"logoutuser_{unique_id}",
                "email": f"logout_{unique_id}@example.com",
                "password": "Password123!",
            },
        )

        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={"email": f"logout_{unique_id}@example.com", "password": "Password123!"},
        )
        tokens = login_response.json()
        refresh_token = tokens["refresh_token"]

        # Logout
        response = await test_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )

        assert response.status_code == 200  # Returns 200 OK

    async def test_logout_token_not_found(self, test_client):
        """Test logout with non-existent token."""
        response = await test_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": "nonexistent_token"},
        )

        # Should still succeed (idempotent)
        assert response.status_code == 200


@pytest.mark.integration
class TestGetCurrentUser:
    """Test getting current user endpoint."""

    async def test_get_current_user_unauthorized(self, test_client):
        """Test getting current user without authentication."""
        response = await test_client.get("/api/v1/auth/me")

        assert response.status_code in [401, 403]

    async def test_get_current_user_authenticated(self, authenticated_test_client):
        """Test getting current user with authentication."""
        response = await authenticated_test_client.get("/api/v1/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert "email" in data
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    async def test_get_current_user_invalid_token(self, test_client):
        """Test getting current user with invalid token."""
        response = await test_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401
