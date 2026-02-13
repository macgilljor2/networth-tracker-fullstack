from typing import Annotated
from fastapi import APIRouter, Depends
from nw_tracker.config.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.services.enum_service import EnumService
from nw_tracker.models.enums_models import AllEnumsResponse


router = APIRouter(
    prefix="/enums",
    tags=["enums"]
)


@router.get("", response_model=AllEnumsResponse)
async def get_enums(db: AsyncSession = Depends(get_db)) -> AllEnumsResponse:
    """
    Get all application enums for frontend dropdowns and validation.

    Returns available values for:
    - Account types (system defaults only - savings, current, loan, credit, investment)
    - Currencies (GBP, USD, EUR)
    - UI Themes (light, dark)

    This endpoint should be called on app initialization to cache enum values
    for use in form dropdowns and client-side validation.

    Note: For user-specific custom account types, use the /account-types endpoint.
    """
    service = EnumService(db)
    return await service.get_all_enums()
