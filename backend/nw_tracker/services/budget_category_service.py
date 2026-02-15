from fastapi import HTTPException
from pydantic import UUID4
from uuid import uuid4
from nw_tracker.repositories.budget_category_repository import BudgetCategoryRepository
from nw_tracker.models.budget_models import BudgetCategoryModel
from nw_tracker.models.budget_request_response_models import (
    BudgetCategoryCreateRequest,
    BudgetCategoryUpdateRequest,
    BudgetCategoryResponse,
)
from nw_tracker.models.models import User
from nw_tracker.logger import get_logger


logger = get_logger()


class BudgetCategoryService():
    def __init__(self, session):
        self.repository = BudgetCategoryRepository(session)

    async def create_category(self, user: User, category_data: BudgetCategoryCreateRequest) -> BudgetCategoryResponse:
        """Create a new budget category."""
        try:
            logger.debug(f"Creating budget category for user: {user.username}")

            category_data_dict = category_data.model_dump()
            category_data_dict["user_id"] = user.id
            category_data_dict["id"] = uuid4()

            new_category = BudgetCategoryModel(**category_data_dict)
            category = await self.repository.create(new_category)

            return BudgetCategoryResponse(
                id=category.id,
                user_id=category.user_id,
                name=category.name,
                description=category.description,
                icon=category.icon,
                color=category.color,
                is_essential=category.is_essential,
                created_at=category.created_at,
                updated_at=category.updated_at,
            )
        except Exception as e:
            logger.error(f"Error creating budget category: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all(self, user: User) -> list[BudgetCategoryResponse]:
        """Get all budget categories for a user."""
        try:
            categories = await self.repository.get_all_for_user(user.id)

            return [
                BudgetCategoryResponse(
                    id=category.id,
                    user_id=category.user_id,
                    name=category.name,
                    description=category.description,
                    icon=category.icon,
                    color=category.color,
                    is_essential=category.is_essential,
                    created_at=category.created_at,
                    updated_at=category.updated_at,
                )
                for category in categories
            ]
        except Exception as e:
            logger.error(f"Error retrieving budget categories: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_category(self, user: User, category_id: UUID4) -> BudgetCategoryResponse:
        """Get a budget category by ID."""
        try:
            # Verify category belongs to user
            if not await self.repository.belongs_to_user(category_id, user.id):
                logger.warning(f"Category with ID {category_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Category does not belong to user")

            category = await self.repository.get_by_id_and_user(category_id, user.id)
            if not category:
                logger.warning(f"Category with ID {category_id} does not exist")
                raise HTTPException(status_code=404, detail="Category not found")

            return BudgetCategoryResponse(
                id=category.id,
                user_id=category.user_id,
                name=category.name,
                description=category.description,
                icon=category.icon,
                color=category.color,
                is_essential=category.is_essential,
                created_at=category.created_at,
                updated_at=category.updated_at,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving budget category: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_category(self, user: User, category_id: UUID4, category_data: BudgetCategoryUpdateRequest) -> BudgetCategoryResponse:
        """Update a budget category."""
        try:
            # Verify category belongs to user
            if not await self.repository.belongs_to_user(category_id, user.id):
                logger.warning(f"Category with ID {category_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Category does not belong to user")

            category = await self.repository.get_by_id(category_id)
            if not category:
                logger.warning(f"Category with ID {category_id} does not exist")
                raise HTTPException(status_code=404, detail="Category not found")

            # Update only non-None values
            update_data = category_data.model_dump(exclude_none=True)
            for key, value in update_data.items():
                setattr(category, key, value)

            updated_category = await self.repository.update(category)

            return BudgetCategoryResponse(
                id=updated_category.id,
                user_id=updated_category.user_id,
                name=updated_category.name,
                description=updated_category.description,
                icon=updated_category.icon,
                color=updated_category.color,
                is_essential=updated_category.is_essential,
                created_at=updated_category.created_at,
                updated_at=updated_category.updated_at,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating budget category: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_category(self, user: User, category_id: UUID4) -> None:
        """Delete a budget category."""
        try:
            # Verify category belongs to user
            if not await self.repository.belongs_to_user(category_id, user.id):
                logger.warning(f"Category with ID {category_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Category does not belong to user")

            logger.debug(f"Deleting category with ID {category_id}")
            category = await self.repository.get_by_id(category_id)
            if not category:
                logger.warning(f"Category with ID {category_id} does not exist")
                raise HTTPException(status_code=404, detail="Category not found")

            await self.repository.delete(category)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting budget category: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
