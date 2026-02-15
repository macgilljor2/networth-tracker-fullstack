from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.budget_request_response_models import (
    BudgetCategoryCreateRequest,
    BudgetCategoryUpdateRequest,
    BudgetCategoryResponse,
)
from nw_tracker.services.budget_category_service import BudgetCategoryService


router = APIRouter(
    prefix="/budget-categories",
    tags=["budget-categories"]
)


@router.post("", status_code=201, response_model=BudgetCategoryResponse)
async def create_category(
    data: BudgetCategoryCreateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new budget category."""
    _service = BudgetCategoryService(db)
    return await _service.create_category(current_user, data)


@router.get("", response_model=list[BudgetCategoryResponse])
async def get_all_categories(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get all budget categories for the authenticated user."""
    _service = BudgetCategoryService(db)
    return await _service.get_all(current_user)


@router.get("/{category_id}", response_model=BudgetCategoryResponse)
async def get_category(
    category_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get a budget category by ID."""
    _service = BudgetCategoryService(db)
    return await _service.get_category(current_user, category_id)


@router.put("/{category_id}", response_model=BudgetCategoryResponse)
async def update_category(
    category_id: UUID4,
    data: BudgetCategoryUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update a budget category by ID."""
    _service = BudgetCategoryService(db)
    return await _service.update_category(current_user, category_id, data)


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: UUID4,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete a budget category by ID."""
    _service = BudgetCategoryService(db)
    return await _service.delete_category(current_user, category_id)
