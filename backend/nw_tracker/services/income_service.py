from fastapi import HTTPException
from pydantic import UUID4
from uuid import uuid4
from nw_tracker.repositories.income_repository import IncomeRepository
from nw_tracker.models.budget_models import IncomeModel
from nw_tracker.models.budget_request_response_models import (
    IncomeCreateRequest,
    IncomeUpdateRequest,
    IncomeResponse,
)
from nw_tracker.models.models import User
from nw_tracker.enums.budget_enums import FrequencyEnum
from nw_tracker.logger import get_logger


logger = get_logger()


class IncomeService():
    def __init__(self, session):
        self.repository = IncomeRepository(session)

    def _validate_one_time_dates(self, frequency: str, effective_month: int | None, effective_year: int | None):
        """Validate that one-time income entries have effective month and year."""
        if frequency == FrequencyEnum.ONE_TIME.value:
            if effective_month is None or effective_year is None:
                raise HTTPException(
                    status_code=400,
                    detail="One-time income entries must have effective_month and effective_year"
                )

    async def create_income(self, user: User, income_data: IncomeCreateRequest) -> IncomeResponse:
        """Create a new income entry."""
        try:
            logger.debug(f"Creating income entry for user: {user.username}")

            # Validate one-time dates
            self._validate_one_time_dates(income_data.frequency, income_data.effective_month, income_data.effective_year)

            income_data_dict = income_data.model_dump()
            income_data_dict["user_id"] = user.id
            income_data_dict["id"] = uuid4()

            new_income = IncomeModel(**income_data_dict)
            income = await self.repository.create(new_income)

            return IncomeResponse(
                id=income.id,
                user_id=income.user_id,
                description=income.description,
                amount=income.amount,
                frequency=income.frequency.value,
                is_net=income.is_net,
                effective_month=income.effective_month,
                effective_year=income.effective_year,
                created_at=income.created_at,
                updated_at=income.updated_at,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating income entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all(self, user: User) -> list[IncomeResponse]:
        """Get all income entries for a user."""
        try:
            income_entries = await self.repository.get_all_for_user(user.id)

            return [
                IncomeResponse(
                    id=income.id,
                    user_id=income.user_id,
                    description=income.description,
                    amount=income.amount,
                    frequency=income.frequency.value,
                    is_net=income.is_net,
                    effective_month=income.effective_month,
                    effective_year=income.effective_year,
                    created_at=income.created_at,
                    updated_at=income.updated_at,
                )
                for income in income_entries
            ]
        except Exception as e:
            logger.error(f"Error retrieving income entries: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_income(self, user: User, income_id: UUID4) -> IncomeResponse:
        """Get an income entry by ID."""
        try:
            # Verify income belongs to user
            if not await self.repository.belongs_to_user(income_id, user.id):
                logger.warning(f"Income with ID {income_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Income does not belong to user")

            income = await self.repository.get_by_id_and_user(income_id, user.id)
            if not income:
                logger.warning(f"Income with ID {income_id} does not exist")
                raise HTTPException(status_code=404, detail="Income not found")

            return IncomeResponse(
                id=income.id,
                user_id=income.user_id,
                description=income.description,
                amount=income.amount,
                frequency=income.frequency.value,
                is_net=income.is_net,
                effective_month=income.effective_month,
                effective_year=income.effective_year,
                created_at=income.created_at,
                updated_at=income.updated_at,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving income entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_income(self, user: User, income_id: UUID4, income_data: IncomeUpdateRequest) -> IncomeResponse:
        """Update an income entry."""
        try:
            # Verify income belongs to user
            if not await self.repository.belongs_to_user(income_id, user.id):
                logger.warning(f"Income with ID {income_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Income does not belong to user")

            income = await self.repository.get_by_id(income_id)
            if not income:
                logger.warning(f"Income with ID {income_id} does not exist")
                raise HTTPException(status_code=404, detail="Income not found")

            # Get current frequency for validation
            new_frequency = income_data.frequency if income_data.frequency is not None else income.frequency.value
            new_effective_month = income_data.effective_month if income_data.effective_month is not None else income.effective_month
            new_effective_year = income_data.effective_year if income_data.effective_year is not None else income.effective_year

            # Validate one-time dates
            self._validate_one_time_dates(new_frequency, new_effective_month, new_effective_year)

            # Update only non-None values
            update_data = income_data.model_dump(exclude_none=True)
            for key, value in update_data.items():
                setattr(income, key, value)

            updated_income = await self.repository.update(income)

            return IncomeResponse(
                id=updated_income.id,
                user_id=updated_income.user_id,
                description=updated_income.description,
                amount=updated_income.amount,
                frequency=updated_income.frequency.value,
                is_net=updated_income.is_net,
                effective_month=updated_income.effective_month,
                effective_year=updated_income.effective_year,
                created_at=updated_income.created_at,
                updated_at=updated_income.updated_at,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating income entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_income(self, user: User, income_id: UUID4) -> None:
        """Delete an income entry."""
        try:
            # Verify income belongs to user
            if not await self.repository.belongs_to_user(income_id, user.id):
                logger.warning(f"Income with ID {income_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Income does not belong to user")

            logger.debug(f"Deleting income with ID {income_id}")
            income = await self.repository.get_by_id(income_id)
            if not income:
                logger.warning(f"Income with ID {income_id} does not exist")
                raise HTTPException(status_code=404, detail="Income not found")

            await self.repository.delete(income)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting income entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
