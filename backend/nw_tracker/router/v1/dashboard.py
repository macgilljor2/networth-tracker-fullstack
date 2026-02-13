from typing import Annotated, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.config.database import get_db
from nw_tracker.config.dependencies import get_current_active_user
from nw_tracker.models.models import User
from nw_tracker.models.request_response_models import (
    DashboardSummaryResponse,
    DashboardHistoryResponse
)
from nw_tracker.services.dashboard_service import DashboardService


router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)


@router.get("", response_model=DashboardSummaryResponse)
async def get_dashboard(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get main dashboard data with totals and distributions."""
    _service = DashboardService(db)
    return await _service.get_dashboard_summary(current_user)


@router.get("/history", response_model=DashboardHistoryResponse)
async def get_dashboard_history(
    current_user: Annotated[User, Depends(get_current_active_user)],
    from_date: Optional[date] = Query(None, description="Filter history from this date (inclusive)"),
    to_date: Optional[date] = Query(None, description="Filter history to this date (inclusive)"),
    db: AsyncSession = Depends(get_db)
):
    """Get balance history for line graph - total and per-group series."""
    _service = DashboardService(db)
    return await _service.get_dashboard_history(current_user, from_date=from_date, to_date=to_date)
