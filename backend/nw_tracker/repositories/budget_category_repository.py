from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from nw_tracker.models.budget_models import BudgetCategoryModel
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class BudgetCategoryRepository(GenericRepository[BudgetCategoryModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, BudgetCategoryModel)

    async def get_all_for_user(self, user_id: UUID4) -> list[BudgetCategoryModel]:
        """Get all budget categories for a user."""
        result = await self.session.execute(
            select(BudgetCategoryModel).filter_by(user_id=user_id)
        )
        return list(result.scalars().all())

    async def get_by_id_and_user(self, category_id: UUID4, user_id: UUID4) -> BudgetCategoryModel | None:
        """Get a budget category by ID and user ID."""
        result = await self.session.execute(
            select(BudgetCategoryModel).filter_by(id=category_id, user_id=user_id)
        )
        return result.scalars().first()

    async def belongs_to_user(self, category_id: UUID4, user_id: UUID4) -> bool:
        """Check if a category belongs to a user."""
        result = await self.session.execute(
            select(BudgetCategoryModel).filter_by(id=category_id, user_id=user_id)
        )
        return bool(result.scalars().first())
