from fastapi import HTTPException
from pydantic import UUID4
from uuid import uuid4
from nw_tracker.repositories.expense_repository import ExpenseRepository
from nw_tracker.repositories.budget_category_repository import BudgetCategoryRepository
from nw_tracker.models.budget_models import ExpenseModel
from nw_tracker.models.budget_request_response_models import (
    ExpenseCreateRequest,
    ExpenseUpdateRequest,
    ExpenseResponse,
    BudgetCategoryResponse,
)
from nw_tracker.models.models import User
from nw_tracker.enums.budget_enums import FrequencyEnum
from nw_tracker.logger import get_logger


logger = get_logger()


class ExpenseService():
    def __init__(self, session):
        self.repository = ExpenseRepository(session)
        self.category_repository = BudgetCategoryRepository(session)

    def _validate_one_time_dates(self, frequency: str, effective_month: int | None, effective_year: int | None):
        """Validate that one-time expense entries have effective month and year."""
        if frequency == FrequencyEnum.ONE_TIME.value:
            if effective_month is None or effective_year is None:
                raise HTTPException(
                    status_code=400,
                    detail="One-time expense entries must have effective_month and effective_year"
                )

    async def _validate_category_ownership(self, user_id: UUID4, category_id: UUID4):
        """Validate that a category belongs to the user."""
        if not await self.category_repository.belongs_to_user(category_id, user_id):
            raise HTTPException(
                status_code=400,
                detail="Category does not belong to user"
            )

    async def create_expense(self, user: User, expense_data: ExpenseCreateRequest) -> ExpenseResponse:
        """Create a new expense entry."""
        try:
            logger.debug(f"Creating expense entry for user: {user.username}")

            # Validate category ownership
            await self._validate_category_ownership(user.id, expense_data.category_id)

            # Validate one-time dates
            self._validate_one_time_dates(expense_data.frequency, expense_data.effective_month, expense_data.effective_year)

            expense_data_dict = expense_data.model_dump()
            expense_data_dict["user_id"] = user.id
            expense_data_dict["id"] = uuid4()

            new_expense = ExpenseModel(**expense_data_dict)
            expense = await self.repository.create(new_expense)

            # Reload with category
            expense = await self.repository.get_by_id_and_user(expense.id, user.id)

            category_response = BudgetCategoryResponse(
                id=expense.category.id,
                user_id=expense.category.user_id,
                name=expense.category.name,
                description=expense.category.description,
                icon=expense.category.icon,
                color=expense.category.color,
                is_essential=expense.category.is_essential,
                created_at=expense.category.created_at,
                updated_at=expense.category.updated_at,
            ) if expense.category else None

            return ExpenseResponse(
                id=expense.id,
                user_id=expense.user_id,
                description=expense.description,
                amount=expense.amount,
                frequency=expense.frequency.value,
                category_id=expense.category_id,
                effective_month=expense.effective_month,
                effective_year=expense.effective_year,
                created_at=expense.created_at,
                updated_at=expense.updated_at,
                category=category_response,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating expense entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all(self, user: User) -> list[ExpenseResponse]:
        """Get all expense entries for a user."""
        try:
            expenses = await self.repository.get_all_for_user(user.id)

            response_list = []
            for expense in expenses:
                category_response = BudgetCategoryResponse(
                    id=expense.category.id,
                    user_id=expense.category.user_id,
                    name=expense.category.name,
                    description=expense.category.description,
                    icon=expense.category.icon,
                    color=expense.category.color,
                    is_essential=expense.category.is_essential,
                    created_at=expense.category.created_at,
                    updated_at=expense.category.updated_at,
                ) if expense.category else None

                response_list.append(
                    ExpenseResponse(
                        id=expense.id,
                        user_id=expense.user_id,
                        description=expense.description,
                        amount=expense.amount,
                        frequency=expense.frequency.value,
                        category_id=expense.category_id,
                        effective_month=expense.effective_month,
                        effective_year=expense.effective_year,
                        created_at=expense.created_at,
                        updated_at=expense.updated_at,
                        category=category_response,
                    )
                )

            return response_list
        except Exception as e:
            logger.error(f"Error retrieving expense entries: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_expense(self, user: User, expense_id: UUID4) -> ExpenseResponse:
        """Get an expense entry by ID."""
        try:
            # Verify expense belongs to user
            if not await self.repository.belongs_to_user(expense_id, user.id):
                logger.warning(f"Expense with ID {expense_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Expense does not belong to user")

            expense = await self.repository.get_by_id_and_user(expense_id, user.id)
            if not expense:
                logger.warning(f"Expense with ID {expense_id} does not exist")
                raise HTTPException(status_code=404, detail="Expense not found")

            category_response = BudgetCategoryResponse(
                id=expense.category.id,
                user_id=expense.category.user_id,
                name=expense.category.name,
                description=expense.category.description,
                icon=expense.category.icon,
                color=expense.category.color,
                is_essential=expense.category.is_essential,
                created_at=expense.category.created_at,
                updated_at=expense.category.updated_at,
            ) if expense.category else None

            return ExpenseResponse(
                id=expense.id,
                user_id=expense.user_id,
                description=expense.description,
                amount=expense.amount,
                frequency=expense.frequency.value,
                category_id=expense.category_id,
                effective_month=expense.effective_month,
                effective_year=expense.effective_year,
                created_at=expense.created_at,
                updated_at=expense.updated_at,
                category=category_response,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving expense entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_expense(self, user: User, expense_id: UUID4, expense_data: ExpenseUpdateRequest) -> ExpenseResponse:
        """Update an expense entry."""
        try:
            # Verify expense belongs to user
            if not await self.repository.belongs_to_user(expense_id, user.id):
                logger.warning(f"Expense with ID {expense_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Expense does not belong to user")

            expense = await self.repository.get_by_id(expense_id)
            if not expense:
                logger.warning(f"Expense with ID {expense_id} does not exist")
                raise HTTPException(status_code=404, detail="Expense not found")

            # Validate category ownership if provided
            if expense_data.category_id is not None:
                await self._validate_category_ownership(user.id, expense_data.category_id)

            # Get current frequency for validation
            new_frequency = expense_data.frequency if expense_data.frequency is not None else expense.frequency.value
            new_effective_month = expense_data.effective_month if expense_data.effective_month is not None else expense.effective_month
            new_effective_year = expense_data.effective_year if expense_data.effective_year is not None else expense.effective_year

            # Validate one-time dates
            self._validate_one_time_dates(new_frequency, new_effective_month, new_effective_year)

            # Update only non-None values
            update_data = expense_data.model_dump(exclude_none=True)
            for key, value in update_data.items():
                setattr(expense, key, value)

            updated_expense = await self.repository.update(expense)

            # Reload with category
            updated_expense = await self.repository.get_by_id_and_user(updated_expense.id, user.id)

            category_response = BudgetCategoryResponse(
                id=updated_expense.category.id,
                user_id=updated_expense.category.user_id,
                name=updated_expense.category.name,
                description=updated_expense.category.description,
                icon=updated_expense.category.icon,
                color=updated_expense.category.color,
                is_essential=updated_expense.category.is_essential,
                created_at=updated_expense.category.created_at,
                updated_at=updated_expense.category.updated_at,
            ) if updated_expense.category else None

            return ExpenseResponse(
                id=updated_expense.id,
                user_id=updated_expense.user_id,
                description=updated_expense.description,
                amount=updated_expense.amount,
                frequency=updated_expense.frequency.value,
                category_id=updated_expense.category_id,
                effective_month=updated_expense.effective_month,
                effective_year=updated_expense.effective_year,
                created_at=updated_expense.created_at,
                updated_at=updated_expense.updated_at,
                category=category_response,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating expense entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_expense(self, user: User, expense_id: UUID4) -> None:
        """Delete an expense entry."""
        try:
            # Verify expense belongs to user
            if not await self.repository.belongs_to_user(expense_id, user.id):
                logger.warning(f"Expense with ID {expense_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Expense does not belong to user")

            logger.debug(f"Deleting expense with ID {expense_id}")
            expense = await self.repository.get_by_id(expense_id)
            if not expense:
                logger.warning(f"Expense with ID {expense_id} does not exist")
                raise HTTPException(status_code=404, detail="Expense not found")

            await self.repository.delete(expense)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting expense entry: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
