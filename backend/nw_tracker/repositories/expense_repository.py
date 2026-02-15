from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from nw_tracker.models.budget_models import ExpenseModel
from nw_tracker.enums.budget_enums import FrequencyEnum
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class ExpenseRepository(GenericRepository[ExpenseModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ExpenseModel)

    async def get_all_for_user(self, user_id: UUID4) -> list[ExpenseModel]:
        """Get all expense entries for a user with category relationships loaded."""
        result = await self.session.execute(
            select(ExpenseModel)
            .options(selectinload(ExpenseModel.category))
            .filter_by(user_id=user_id)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, expense_id: UUID4, user_id: UUID4) -> ExpenseModel | None:
        """Get an expense entry by ID and user ID with category loaded."""
        result = await self.session.execute(
            select(ExpenseModel)
            .options(selectinload(ExpenseModel.category))
            .filter_by(id=expense_id, user_id=user_id)
        )
        return result.scalars().first()

    async def belongs_to_user(self, expense_id: UUID4, user_id: UUID4) -> bool:
        """Check if an expense entry belongs to a user."""
        result = await self.session.execute(
            select(ExpenseModel).filter_by(id=expense_id, user_id=user_id)
        )
        return bool(result.scalars().first())

    async def get_by_category(self, user_id: UUID4, category_id: UUID4) -> list[ExpenseModel]:
        """Get all expense entries for a user in a specific category."""
        result = await self.session.execute(
            select(ExpenseModel)
            .options(selectinload(ExpenseModel.category))
            .filter_by(user_id=user_id, category_id=category_id)
        )
        return list(result.scalars().all())

    async def get_by_frequency(self, user_id: UUID4, frequency: FrequencyEnum) -> list[ExpenseModel]:
        """Get all expense entries for a user with a specific frequency."""
        result = await self.session.execute(
            select(ExpenseModel)
            .options(selectinload(ExpenseModel.category))
            .filter_by(user_id=user_id, frequency=frequency)
        )
        return list(result.scalars().all())

    async def get_one_time_for_month(self, user_id: UUID4, month: int, year: int) -> list[ExpenseModel]:
        """Get all one-time expense entries for a specific month and year."""
        result = await self.session.execute(
            select(ExpenseModel)
            .options(selectinload(ExpenseModel.category))
            .filter_by(
                user_id=user_id,
                frequency=FrequencyEnum.ONE_TIME,
                effective_month=month,
                effective_year=year
            )
        )
        return list(result.scalars().all())

    async def get_monthly_expenses(self, user_id: UUID4) -> list[ExpenseModel]:
        """Get all monthly expense entries for a user."""
        return await self.get_by_frequency(user_id, FrequencyEnum.MONTHLY)
