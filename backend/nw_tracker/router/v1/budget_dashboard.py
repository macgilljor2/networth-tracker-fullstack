from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.budget_request_response_models import BudgetSummaryResponse, BudgetTrendsResponse
from nw_tracker.services.budget_dashboard_service import BudgetDashboardService


router = APIRouter(
    prefix="/budget-dashboard",
    tags=["budget-dashboard"]
)


@router.get("/summary", response_model=BudgetSummaryResponse)
async def get_current_month_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get budget summary for the current month."""
    _service = BudgetDashboardService(db)
    return await _service.calculate_current_month_summary(current_user)


@router.get("/summary/{month}/{year}", response_model=BudgetSummaryResponse)
async def get_monthly_summary(
    month: int,
    year: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get budget summary for a specific month."""
    _service = BudgetDashboardService(db)
    return await _service.calculate_monthly_summary(current_user, month, year)


@router.get("/yearly/{year}", response_model=dict)
async def get_yearly_summary(
    year: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get budget summary for a specific year."""
    _service = BudgetDashboardService(db)
    return await _service.calculate_yearly_summary(current_user, year)


@router.get("/trends", response_model=BudgetTrendsResponse)
async def get_trends(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
    months: int = Query(6, ge=1, le=24, description="Number of months to show trends for")
):
    """Get budget trends over the last N months."""
    _service = BudgetDashboardService(db)
    return await _service.get_trends(current_user, months)
