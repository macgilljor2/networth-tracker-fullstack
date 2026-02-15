from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from nw_tracker.models.budget_models import IncomeModel
from nw_tracker.enums.budget_enums import FrequencyEnum
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class IncomeRepository(GenericRepository[IncomeModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, IncomeModel)

    async def get_all_for_user(self, user_id: UUID4) -> list[IncomeModel]:
        """Get all income entries for a user."""
        result = await self.session.execute(
            select(IncomeModel).filter_by(user_id=user_id)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, income_id: UUID4, user_id: UUID4) -> IncomeModel | None:
        """Get an income entry by ID and user ID."""
        result = await self.session.execute(
            select(IncomeModel).filter_by(id=income_id, user_id=user_id)
        )
        return result.scalars().first()

    async def belongs_to_user(self, income_id: UUID4, user_id: UUID4) -> bool:
        """Check if an income entry belongs to a user."""
        result = await self.session.execute(
            select(IncomeModel).filter_by(id=income_id, user_id=user_id)
        )
        return bool(result.scalars().first())

    async def get_by_frequency(self, user_id: UUID4, frequency: FrequencyEnum) -> list[IncomeModel]:
        """Get all income entries for a user with a specific frequency."""
        result = await self.session.execute(
            select(IncomeModel).filter_by(user_id=user_id, frequency=frequency)
        )
        return list(result.scalars().all())

    async def get_one_time_for_month(self, user_id: UUID4, month: int, year: int) -> list[IncomeModel]:
        """Get all one-time income entries for a specific month and year."""
        result = await self.session.execute(
            select(IncomeModel).filter_by(
                user_id=user_id,
                frequency=FrequencyEnum.ONE_TIME,
                effective_month=month,
                effective_year=year
            )
        )
        return list(result.scalars().all())

    async def get_monthly_income(self, user_id: UUID4) -> list[IncomeModel]:
        """Get all monthly income entries for a user."""
        return await self.get_by_frequency(user_id, FrequencyEnum.MONTHLY)
