from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import UUID4

from nw_tracker.repositories.base_repository import GenericRepository
from nw_tracker.models.models import AccountTypeDefinition
from nw_tracker.logger import get_logger

logger = get_logger()


class AccountTypeRepository(GenericRepository[AccountTypeDefinition]):
    """Repository for account type definitions."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, AccountTypeDefinition)

    async def get_all_for_user(self, user_id: UUID4) -> List[AccountTypeDefinition]:
        """Get all account types available to a user (system defaults + user's custom types)."""
        try:
            logger.debug(f"Fetching account types for user: {user_id}")

            # Get system defaults (user_id IS NULL) and user's custom types
            result = await self.session.execute(
                select(AccountTypeDefinition)
                .where(
                    or_(
                        AccountTypeDefinition.user_id == None,
                        AccountTypeDefinition.user_id == user_id
                    )
                )
                .order_by(AccountTypeDefinition.is_default.desc(), AccountTypeDefinition.name)
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error fetching account types for user {user_id}: {e}")
            raise

    async def get_by_name(self, name: str) -> Optional[AccountTypeDefinition]:
        """Get an account type by name."""
        try:
            result = await self.session.execute(
                select(AccountTypeDefinition)
                .where(AccountTypeDefinition.name == name)
            )
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Error fetching account type by name {name}: {e}")
            raise

    async def get_system_defaults(self) -> List[AccountTypeDefinition]:
        """Get all system default account types."""
        try:
            logger.debug("Fetching system default account types")
            result = await self.session.execute(
                select(AccountTypeDefinition)
                .where(AccountTypeDefinition.user_id == None)
                .order_by(AccountTypeDefinition.name)
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error fetching system default account types: {e}")
            raise

    async def get_user_custom_types(self, user_id: UUID4) -> List[AccountTypeDefinition]:
        """Get user's custom account types (non-default)."""
        try:
            logger.debug(f"Fetching custom account types for user: {user_id}")
            result = await self.session.execute(
                select(AccountTypeDefinition)
                .where(
                    and_(
                        AccountTypeDefinition.user_id == user_id,
                        AccountTypeDefinition.is_default == False
                    )
                )
                .order_by(AccountTypeDefinition.name)
            )
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error fetching custom account types for user {user_id}: {e}")
            raise

    async def is_name_exists_for_user(self, user_id: UUID4, name: str, exclude_id: Optional[UUID4] = None) -> bool:
        """Check if an account type with the given name exists for a specific user (custom types only)."""
        try:
            query = select(AccountTypeDefinition).where(
                and_(
                    AccountTypeDefinition.user_id == user_id,
                    AccountTypeDefinition.name == name
                )
            )
            if exclude_id:
                query = query.where(AccountTypeDefinition.id != exclude_id)

            result = await self.session.execute(query)
            return result.scalars().first() is not None
        except Exception as e:
            logger.error(f"Error checking if account type name {name} exists for user {user_id}: {e}")
            raise
