from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.budget_request_response_models import (
    ExpenseCreateRequest,
    ExpenseUpdateRequest,
    ExpenseResponse,
)
from nw_tracker.services.expense_service import ExpenseService


router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)


@router.post("", status_code=201, response_model=ExpenseResponse)
async def create_expense(
    data: ExpenseCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new expense entry."""
    _service = ExpenseService(db)
    return await _service.create_expense(current_user, data)


@router.get("", response_model=list[ExpenseResponse])
async def get_all_expenses(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get all expense entries for the authenticated user."""
    _service = ExpenseService(db)
    return await _service.get_all(current_user)


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get an expense entry by ID."""
    _service = ExpenseService(db)
    return await _service.get_expense(current_user, expense_id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: UUID4,
    data: ExpenseUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update an expense entry by ID."""
    _service = ExpenseService(db)
    return await _service.update_expense(current_user, expense_id, data)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete an expense entry by ID."""
    _service = ExpenseService(db)
    return await _service.delete_expense(current_user, expense_id)
