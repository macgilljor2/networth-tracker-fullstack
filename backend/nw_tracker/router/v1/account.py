from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.request_response_models import AccountCreateRequest, AccountUpdateRequest, AccountResponse
from nw_tracker.services.account_service import AccountService


router = APIRouter(
    prefix="/accounts",
    tags=["accounts"]
)


# all the api endpoints for account
@router.post("", status_code=201, response_model=AccountResponse)
async def create_account(
    data: AccountCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new account for the authenticated user.
    """
    _service = AccountService(db)
    return await _service.create_account(current_user, data)


@router.get("", response_model=list[AccountResponse])
async def get_all_accounts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get all accounts for the authenticated user.
    """
    _service = AccountService(db)
    return await _service.get_all(current_user)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Get an account by ID.
    Verifies the account belongs to the authenticated user.
    """
    _service = AccountService(db)
    return await _service.get_account(current_user, account_id)


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: UUID4,
    data: AccountUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Update an account by ID.
    Verifies the account belongs to the authenticated user.
    """
    _service = AccountService(db)
    return await _service.update_account(current_user, account_id, data)


@router.patch("/{account_id}/toggle-exclusion", response_model=AccountResponse)
async def toggle_account_exclusion(
    account_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle whether an account is excluded from total net worth calculations.
    Verifies the account belongs to the authenticated user.
    """
    _service = AccountService(db)
    return await _service.toggle_exclusion(current_user, account_id)


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an account by ID.
    Verifies the account belongs to the authenticated user.
    """
    _service = AccountService(db)
    return await _service.delete_account(current_user, account_id)
