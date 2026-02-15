from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.budget_request_response_models import (
    IncomeCreateRequest,
    IncomeUpdateRequest,
    IncomeResponse,
)
from nw_tracker.services.income_service import IncomeService


router = APIRouter(
    prefix="/income",
    tags=["income"]
)


@router.post("", status_code=201, response_model=IncomeResponse)
async def create_income(
    data: IncomeCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new income entry."""
    _service = IncomeService(db)
    return await _service.create_income(current_user, data)


@router.get("", response_model=list[IncomeResponse])
async def get_all_income(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get all income entries for the authenticated user."""
    _service = IncomeService(db)
    return await _service.get_all(current_user)


@router.get("/{income_id}", response_model=IncomeResponse)
async def get_income(
    income_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get an income entry by ID."""
    _service = IncomeService(db)
    return await _service.get_income(current_user, income_id)


@router.put("/{income_id}", response_model=IncomeResponse)
async def update_income(
    income_id: UUID4,
    data: IncomeUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update an income entry by ID."""
    _service = IncomeService(db)
    return await _service.update_income(current_user, income_id, data)


@router.delete("/{income_id}", status_code=204)
async def delete_income(
    income_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete an income entry by ID."""
    _service = IncomeService(db)
    return await _service.delete_income(current_user, income_id)
