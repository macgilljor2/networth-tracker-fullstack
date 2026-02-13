from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from nw_tracker.models.models import User
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class UserRepository(GenericRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def get_user_by_username(self, user_name: str):
        result = await self.session.execute(
            select(User).filter(User.username == user_name)
        )
        return result.scalars().first()

    async def get_by_email(self, email: str):
        """Get a user by email address."""
        result = await self.session.execute(
            select(User).filter(User.email == email)
        )
        return result.scalars().first()

    async def exists_by_name(self, user_name: str) -> bool:
        result = await self.session.execute(
            select(User).filter(User.username == user_name)
        )
        user = result.scalars().first()
        return bool(user)
