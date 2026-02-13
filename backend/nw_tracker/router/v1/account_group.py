from typing import Annotated, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.request_response_models import (
    AccountGroupSummaryResponse,
    AccountGroupWithHistoryResponse,
    AccountGroupCreateRequest,
    AccountGroupUpdateRequest,
    AccountGroupResponse
)
from nw_tracker.services.account_group_service import AccountGroupService


router = APIRouter(
    prefix="/account-groups",
    tags=["account-groups"]
)


@router.post("", status_code=201, response_model=AccountGroupResponse)
async def create_account_group(
    data: AccountGroupCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new account group for the authenticated user."""
    _service = AccountGroupService(db)
    return await _service.create_account_group(current_user, data)


@router.get("", response_model=list[AccountGroupSummaryResponse])
async def get_all_account_groups(
    current_user: Annotated[User, Depends(get_current_active_user)],
    from_date: Optional[date] = Query(None, description="Filter balance history from this date (inclusive)"),
    to_date: Optional[date] = Query(None, description="Filter balance history to this date (inclusive)"),
    db: AsyncSession = Depends(get_db)
):
    """Get all account groups for the authenticated user with summary data and balance history."""
    _service = AccountGroupService(db)
    return await _service.get_all(current_user, from_date=from_date, to_date=to_date)


@router.get("/{account_group_id}", response_model=AccountGroupWithHistoryResponse)
async def get_account_group(
    account_group_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    from_date: Optional[date] = Query(None, description="Filter balance history from this date (inclusive)"),
    to_date: Optional[date] = Query(None, description="Filter balance history to this date (inclusive)"),
    db: AsyncSession = Depends(get_db)
):
    """Get an account group by ID with lite account list and balance history."""
    _service = AccountGroupService(db)
    return await _service.get_account_group(current_user, account_group_id, from_date=from_date, to_date=to_date)


@router.put("/{account_group_id}", response_model=AccountGroupResponse)
async def update_account_group(
    account_group_id: UUID4,
    data: AccountGroupUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update an account group by ID."""
    _service = AccountGroupService(db)
    return await _service.update_account_group(current_user, account_group_id, data)


@router.delete("/{account_group_id}", status_code=204)
async def delete_account_group(
    account_group_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete an account group by ID."""
    _service = AccountGroupService(db)
    return await _service.delete_account_group(current_user, account_group_id)
