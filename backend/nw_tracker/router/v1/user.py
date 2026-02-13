from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.models.request_response_models import UserCreateRequest, UserUpdateRequest, UserResponse
from nw_tracker.services.user_service import UserService


router = APIRouter(
    prefix="/user",
    tags=["user"]
)


@router.post("", status_code=201, response_model=UserResponse)
async def create_user(data: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a new user.
    """
    _service = UserService(db)
    return await _service.create_user(data)

@router.get("", response_model=list[UserResponse])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    """
    Get all users.
    """
    _service = UserService(db)
    return await _service.get_all()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID4, db: AsyncSession = Depends(get_db)):
    """
    Get a user by ID.
    """
    _service = UserService(db)
    return await _service.get_user(user_id)

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: UUID4, db: AsyncSession = Depends(get_db)):
    """
    Delete a user by ID.
    """
    _service = UserService(db)
    return await _service.delete_user(user_id)
