from fastapi import HTTPException
from pydantic import UUID4
from nw_tracker.repositories.user_repository import UserRepository
from nw_tracker.repositories.settings_repository import UserSettingsRepository
from nw_tracker.models.models import User, UserSettings
from nw_tracker.models.request_response_models import UserCreateRequest, UserUpdateRequest, UserResponse
from nw_tracker.logger import get_logger

logger = get_logger()


class UserService():

    def __init__(self, session):
        self.repository = UserRepository(session)
        self.settings_repository = UserSettingsRepository(session)

    async def create_user(self, user_data: UserCreateRequest) -> UserResponse:
        try:

            if await self.repository.exists_by_name(user_data.username):
                logger.warning(f"User with username {user_data.username} already exists")
                raise HTTPException(status_code=400, detail="Username already exists")

            logger.debug(f"User does not exist, proceeding to create a new user")

            user_data = user_data.model_dump()

            logger.debug(f"Creating user with data: {user_data}")

            new_user = User(**user_data)

            logger.debug(f"User object created: {new_user}")

            user = await self.repository.create(new_user)

            logger.debug(f"User object created in DB: {user.id}")

            new_settings = UserSettings(user_id=user.id)

            logger.debug(f"User settings object created: {new_settings}")

            settings = await self.settings_repository.create(new_settings)

            return UserResponse.model_validate(user)

        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all(self) -> list[UserResponse]:
        try:
            users = await self.repository.get_all()
            return [UserResponse.model_validate(user) for user in users]
        except Exception as e:
            logger.error(f"Error retrieving users: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_user(self, user_id: UUID4) -> UserResponse:
        try:
            user = await self.repository.get_by_id(user_id)
            if user:
                return UserResponse.model_validate(user)
            else:
                logger.warning(f"User with ID {user_id} not found")
                raise HTTPException(status_code=404, detail="User not found")
        except Exception as e:
            logger.error(f"Error retrieving user: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_user(self, user_id: str, user_update_request: UserUpdateRequest) -> UserResponse:
        try:

            user = await self.repository.get_by_id(user_id)
            if not user:
                logger.warning(f"User with ID {user_id} not found")
                raise HTTPException(status_code=404, detail="User not found")
            if user_update_request.username and await self.repository.exists_by_name(user_update_request.username):
                logger.warning(f"User with username {user_update_request.username} already exists")
                raise HTTPException(status_code=400, detail="Username already exists")
            user_data = user_update_request.model_dump()

            # update the user object with the new data
            for key, value in user_data.items():
                setattr(user, key, value)

            updated_user = await self.repository.update(user)


            return UserResponse.model_validate(updated_user)

        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")



    async def delete_user(self, user_id: UUID4) -> bool:
        if not await self.repository.exists_by_id(user_id):
            logger.warning(f"User with ID {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")

        try:
            await self.repository.delete_by_id(user_id)
            logger.info(f"User with ID {user_id} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
