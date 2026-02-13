from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_user
from nw_tracker.models.models import User
from nw_tracker.services.auth_service import AuthService
from nw_tracker.models.request_response_models import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserMeResponse
)
from nw_tracker.logger import get_logger

logger = get_logger()

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)


@router.post("/register", status_code=201, response_model=UserMeResponse)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.

    - **username**: 3-50 characters
    - **email**: Must be valid email format
    - **password**: Minimum 8 characters
    """
    auth_service = AuthService(db)
    user = await auth_service.register_user(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password
    )
    return UserMeResponse.model_validate(user, from_attributes=True)


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.

    Returns access_token and sets refresh_token as httpOnly cookie.
    """
    auth_service = AuthService(db)
    access_token, refresh_token = await auth_service.login(
        email=credentials.email,
        password=credentials.password
    )

    # Set httpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # True in production with HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=15 * 60  # 15 minutes in seconds
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token from httpOnly cookie.
    """
    if not refresh_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Refresh token missing")

    auth_service = AuthService(db)
    access_token = await auth_service.refresh_access_token(
        refresh_token=refresh_token
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=15 * 60  # 15 minutes in seconds
    )


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user by revoking refresh token and clearing cookie.
    """
    if refresh_token:
        auth_service = AuthService(db)
        await auth_service.logout(refresh_token)

    # Clear the cookie
    response.delete_cookie("refresh_token")

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserMeResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get current authenticated user information.

    Requires valid access token in Authorization header.
    """
    return UserMeResponse.model_validate(current_user, from_attributes=True)
