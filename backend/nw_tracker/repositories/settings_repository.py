from sqlalchemy.ext.asyncio import AsyncSession
from nw_tracker.models.models import UserSettings
from nw_tracker.logger import get_logger
from nw_tracker.repositories.base_repository import GenericRepository


logger = get_logger()


class UserSettingsRepository(GenericRepository[UserSettings]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, UserSettings)
