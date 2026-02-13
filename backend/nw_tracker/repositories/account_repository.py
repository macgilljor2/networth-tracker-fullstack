from pydantic import UUID4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from nw_tracker.models.models import Account
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class AccountRepository(GenericRepository[Account]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Account)

    async def get_by_id_and_user(self, account_id: UUID4, user_id: UUID4) -> Account | None:
        """
        Get an account by ID and user ID with eager loaded relationships.
        """
        result = await self.session.execute(
            select(Account)
            .options(
                selectinload(Account.balances),
                selectinload(Account.groups)
            )
            .filter_by(id=account_id, user_id=user_id)
        )
        return result.scalars().first()

    async def get_all_for_user(self, user_id: UUID4) -> list[Account]:
        """
        Get all accounts for a user with eager loaded relationships.
        """
        result = await self.session.execute(
            select(Account)
            .options(
                selectinload(Account.balances),
                selectinload(Account.groups)
            )
            .filter_by(user_id=user_id)
        )
        return list(result.scalars().all())

    async def account_belongs_to_user(self, account_id: UUID4, user_id: UUID4) -> bool:
        """
        Check if an account belongs to a user.
        """
        result = await self.session.execute(
            select(Account).filter_by(id=account_id, user_id=user_id)
        )
        return bool(result.scalars().first())

    async def get_by_id_with_relations(self, account_id: UUID4) -> Account | None:
        """
        Get an account by ID with eager loaded relationships (balances, groups).
        """
        result = await self.session.execute(
            select(Account)
            .options(
                selectinload(Account.balances),
                selectinload(Account.groups)
            )
            .filter_by(id=account_id)
        )
        return result.scalars().first()

    async def get_by_account_type(self, account_type: str) -> list[Account]:
        """
        Get all accounts with a specific account type.
        """
        result = await self.session.execute(
            select(Account).filter_by(account_type=account_type)
        )
        return list(result.scalars().all())
