from datetime import datetime, timedelta
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from nw_tracker.models.models import User
from nw_tracker.models.auth_models import RefreshToken
from nw_tracker.repositories.user_repository import UserRepository
from nw_tracker.repositories.auth_repository import RefreshTokenRepository
from nw_tracker.config.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token
)
from nw_tracker.config.settings import get_settings
from nw_tracker.logger import get_logger

logger = get_logger()
settings = get_settings()


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repository = UserRepository(session)
        self.refresh_token_repository = RefreshTokenRepository(session)

    async def register_user(self, username: str, email: str, password: str) -> User:
        """Register a new user with password hashing."""
        # Check if user already exists
        if await self.user_repository.get_by_email(email):
            logger.warning(f"Registration attempt with existing email: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        if await self.user_repository.exists_by_name(username):
            logger.warning(f"Registration attempt with existing username: {username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Validate password strength
        if len(password) < settings.password_min_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password must be at least {settings.password_min_length} characters"
            )

        # Hash password
        password_hash = get_password_hash(password)

        # Create user
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            is_active=True
        )

        created_user = await self.user_repository.create(user)
        logger.info(f"New user registered: {created_user.email}")
        return created_user

    async def login(self, email: str, password: str) -> tuple[str, str]:
        """Authenticate user and return access and refresh tokens."""
        # Find user by email
        user = await self.user_repository.get_by_email(email)
        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Check if user is active
        if not user.is_active:
            logger.warning(f"Login attempt by inactive user: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        # Verify password (if user has password_hash set)
        if user.password_hash:
            if not verify_password(password, user.password_hash):
                logger.warning(f"Failed login attempt for email: {email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password"
                )

        # Update last login
        user.last_login = datetime.utcnow()
        await self.user_repository.update(user)

        # Create tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "username": user.username}
        )

        # Create refresh token
        refresh_token_str = create_refresh_token(
            data={"sub": str(user.id), "type": "refresh"}
        )

        # Store refresh token in database
        expires_at = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
        await self.refresh_token_repository.create_refresh_token(
            token=refresh_token_str,
            user_id=user.id,
            expires_at=expires_at
        )

        logger.info(f"User logged in: {email}")
        return access_token, refresh_token_str

    async def refresh_access_token(self, refresh_token: str) -> str:
        """Refresh access token using refresh token."""
        # Validate refresh token in database
        token_record = await self.refresh_token_repository.get_valid_token(refresh_token)
        if not token_record:
            logger.warning("Invalid or expired refresh token used")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        # Decode refresh token to get user info
        payload = decode_refresh_token(refresh_token)
        if not payload:
            logger.warning("Could not decode refresh token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Get user
        user = await self.user_repository.get_by_id(UUID(payload["sub"]))
        if not user or not user.is_active:
            logger.warning(f"Refresh token for inactive/non-existent user: {payload['sub']}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        # Create new access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "username": user.username}
        )

        logger.info(f"Access token refreshed for user: {user.email}")
        return access_token

    async def logout(self, refresh_token: str) -> None:
        """Logout user by revoking refresh token."""
        success = await self.refresh_token_repository.revoke_token(refresh_token)
        if success:
            logger.info("User logged out successfully")
        else:
            logger.warning("Attempted to logout with non-existent token")

    async def get_current_user_from_token(self, token: str) -> User:
        """Validate access token and return current user."""
        # Decode token
        payload = decode_access_token(token)
        if not payload:
            logger.warning("Invalid access token used")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user_id from token
        user_id_str = payload.get("sub")
        if not user_id_str:
            logger.warning("Access token missing user_id")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user from database
        user = await self.user_repository.get_by_id(UUID(user_id_str))
        if not user:
            logger.warning(f"Token for non-existent user: {user_id_str}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            logger.warning(f"Inactive user attempted access: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user"
            )

        return user
