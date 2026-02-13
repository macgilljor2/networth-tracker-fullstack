from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.request_response_models import BalanceCreateInitial, BalanceUpdateRequest, BalanceResponse
from nw_tracker.services.balance_service import BalanceService


router = APIRouter(
    prefix="/accounts/{account_id}/balances",
    tags=["balances"]
)


@router.post("", status_code=201, response_model=BalanceResponse)
async def create_balance(
    account_id: UUID4,
    data: BalanceCreateInitial,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new balance entry for an account."""
    _service = BalanceService(db)
    return await _service.create_balance(current_user, account_id, data.model_dump())


@router.get("", response_model=list[BalanceResponse])
async def get_all_balances(
    account_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get all balance entries for an account."""
    _service = BalanceService(db)
    return await _service.get_all_balances_for_account(current_user, account_id)


@router.get("/{balance_id}", response_model=BalanceResponse)
async def get_balance(
    account_id: UUID4,
    balance_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get a balance entry by ID."""
    _service = BalanceService(db)
    return await _service.get_balance(current_user, account_id, balance_id)


@router.put("/{balance_id}", response_model=BalanceResponse)
async def update_balance(
    account_id: UUID4,
    balance_id: UUID4,
    data: BalanceUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update a balance entry by ID."""
    _service = BalanceService(db)
    return await _service.update_balance(current_user, account_id, balance_id, data)


@router.delete("/{balance_id}", status_code=204)
async def delete_balance(
    account_id: UUID4,
    balance_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete a balance entry by ID."""
    _service = BalanceService(db)
    return await _service.delete_balance(current_user, account_id, balance_id)
