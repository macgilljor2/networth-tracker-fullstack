from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from nw_tracker.models.enums_models import AllEnumsResponse, get_enum_values, EnumValue
from nw_tracker.models.models import AccountTypeDefinition, Currency, Theme
from nw_tracker.repositories.account_type_repository import AccountTypeRepository
from nw_tracker.logger import get_logger

logger = get_logger()


class EnumService:
    """Service for exposing application enums to frontend."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_enums(self) -> AllEnumsResponse:
        """Get all application enums for frontend dropdowns and validation."""
        try:
            logger.debug("Retrieving all application enums")

            # Fetch system default account types from database
            account_type_repo = AccountTypeRepository(self.session)
            system_types = await account_type_repo.get_system_defaults()

            # Convert to enum format
            account_type_values = [
                EnumValue(value=t.name, label=t.label)
                for t in system_types
            ]

            return AllEnumsResponse(
                account_types=account_type_values,
                currencies=get_enum_values(Currency),
                themes=get_enum_values(Theme)
            )
        except Exception as e:
            logger.error(f"Error retrieving enums: {e}")
            raise
