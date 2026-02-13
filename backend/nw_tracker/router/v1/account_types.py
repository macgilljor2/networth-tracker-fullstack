from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession

from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.request_response_models import (
    AccountTypeCreateRequest,
    AccountTypeUpdateRequest,
    AccountTypeResponse,
)
from nw_tracker.services.account_type_service import AccountTypeService

router = APIRouter(
    prefix="/account-types",
    tags=["account-types"]
)


@router.get("", response_model=list[AccountTypeResponse])
async def get_account_types(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get all account types available to the authenticated user (system defaults + custom)."""
    service = AccountTypeService(db)
    types = await service.get_all_types(current_user)
    return types


@router.post("", status_code=201, response_model=AccountTypeResponse)
async def create_account_type(
    data: AccountTypeCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new custom account type for the authenticated user."""
    service = AccountTypeService(db)
    return await service.create_account_type(
        user=current_user,
        name=data.name,
        label=data.label,
        icon=data.icon
    )


@router.put("/{account_type_id}", response_model=AccountTypeResponse)
async def update_account_type(
    account_type_id: UUID4,
    data: AccountTypeUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update a custom account type (user's own types only)."""
    service = AccountTypeService(db)
    return await service.update_account_type(
        user=current_user,
        type_id=account_type_id,
        label=data.label,
        icon=data.icon
    )


@router.delete("/{account_type_id}", status_code=204)
async def delete_account_type(
    account_type_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom account type (user's own types only, if not in use by any accounts)."""
    service = AccountTypeService(db)
    await service.delete_account_type(
        user=current_user,
        type_id=account_type_id
    )
