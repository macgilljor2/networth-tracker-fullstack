from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from nw_tracker.models.models import Balance
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class BalanceRepository(GenericRepository[Balance]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Balance)

    async def get_all_balances_by_account_id(self, account_id: str):
        try:
            result = await self.session.execute(
                select(Balance).filter(Balance.account_uuid == account_id)
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Database error while retrieving balances: {e}")
            raise Exception(f"An error occurred while retrieving the balances for account ID: {account_id}.")

    async def get_latest_balance_by_account_id(self, account_id: str):
        try:
            result = await self.session.execute(
                select(Balance)
                .filter(Balance.account_uuid == account_id)
                .order_by(Balance.date.desc())
            )
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Database error while retrieving latest balance: {e}")
            raise Exception(f"An error occurred while retrieving the latest balance for account ID: {account_id}.")
