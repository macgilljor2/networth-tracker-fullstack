from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from nw_tracker.models.models import AccountGroup, Account
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class AccountGroupRepository(GenericRepository[AccountGroup]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AccountGroup)

    async def get_account_group_by_name(self, name: str):
        try:
            result = await self.session.execute(
                select(AccountGroup)
                .options(selectinload(AccountGroup.accounts))
                .filter(AccountGroup.name == name)
            )
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Database error while retrieving account group: {e}")
            raise Exception(f"An error occurred while retrieving the account group: {name}.")

    async def get_all_for_user_with_balances(self, user_id: UUID4):
        """Get all account groups for a user with accounts AND balances eagerly loaded."""
        try:
            from nw_tracker.models.models import Account
            result = await self.session.execute(
                select(AccountGroup)
                .options(
                    selectinload(AccountGroup.accounts)
                    .selectinload(Account.balances)
                )
                .filter(AccountGroup.user_id == user_id)
                .order_by(AccountGroup.created_at)
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Database error while retrieving account groups for user {user_id}: {e}")
            raise Exception(f"An error occurred while retrieving account groups for user {user_id}.")

    async def get_all_for_user(self, user_id: UUID4):
        """Get all account groups for a user with accounts eagerly loaded in a single query."""
        try:
            result = await self.session.execute(
                select(AccountGroup)
                .options(selectinload(AccountGroup.accounts))
                .filter(AccountGroup.user_id == user_id)
                .order_by(AccountGroup.created_at)
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Database error while retrieving account groups for user {user_id}: {e}")
            raise Exception(f"An error occurred while retrieving account groups for user {user_id}.")

    async def get_by_id_and_user(self, account_group_id: UUID4, user_id: UUID4):
        """Get account group by ID and user with accounts eagerly loaded in a single query."""
        try:
            result = await self.session.execute(
                select(AccountGroup)
                .options(selectinload(AccountGroup.accounts))
                .filter(
                    AccountGroup.id == account_group_id,
                    AccountGroup.user_id == user_id
                )
            )
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Database error while retrieving account group {account_group_id} for user {user_id}: {e}")
            raise Exception(f"An error occurred while retrieving account group {account_group_id} for user {user_id}.")

    async def get_by_id_with_accounts(self, account_group_id: UUID4):
        """Get account group by ID with accounts eagerly loaded in a single query."""
        try:
            result = await self.session.execute(
                select(AccountGroup)
                .options(selectinload(AccountGroup.accounts))
                .filter(AccountGroup.id == account_group_id)
            )
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Database error while retrieving account group {account_group_id}: {e}")
            raise Exception(f"An error occurred while retrieving account group: {account_group_id}.")

    async def get_by_id_and_user_with_balances(self, account_group_id: UUID4, user_id: UUID4):
        """Get account group by ID and user with accounts AND balances eagerly loaded."""
        try:
            from nw_tracker.models.models import Account
            result = await self.session.execute(
                select(AccountGroup)
                .options(
                    selectinload(AccountGroup.accounts)
                    .selectinload(Account.balances)
                )
                .filter(
                    AccountGroup.id == account_group_id,
                    AccountGroup.user_id == user_id
                )
            )
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Database error while retrieving account group {account_group_id} for user {user_id}: {e}")
            raise Exception(f"An error occurred while retrieving account group {account_group_id} for user {user_id}.")
