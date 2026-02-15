from datetime import datetime, date
from fastapi import HTTPException
from pydantic import UUID4
from collections import defaultdict
from nw_tracker.repositories.income_repository import IncomeRepository
from nw_tracker.repositories.expense_repository import ExpenseRepository
from nw_tracker.models.budget_request_response_models import (
    BudgetSummaryResponse,
    BudgetTrendsResponse,
    BudgetTrendMonth,
    ExpenseBreakdownItem,
)
from nw_tracker.models.models import User
from nw_tracker.enums.budget_enums import FrequencyEnum
from nw_tracker.logger import get_logger


logger = get_logger()


class BudgetDashboardService():
    def __init__(self, session):
        self.income_repository = IncomeRepository(session)
        self.expense_repository = ExpenseRepository(session)

    async def calculate_monthly_summary(self, user: User, month: int, year: int) -> BudgetSummaryResponse:
        """Calculate budget summary for a specific month."""
        try:
            logger.debug(f"Calculating budget summary for user {user.username} - {month}/{year}")

            # Get all monthly income
            monthly_income = await self.income_repository.get_monthly_income(user.id)
            total_monthly_income = sum(income.amount for income in monthly_income)

            # Get one-time income for this month
            one_time_income = await self.income_repository.get_one_time_for_month(user.id, month, year)
            total_one_time_income = sum(income.amount for income in one_time_income)

            # Get all monthly expenses
            monthly_expenses = await self.expense_repository.get_monthly_expenses(user.id)
            total_monthly_expenses = sum(expense.amount for expense in monthly_expenses)

            # Get one-time expenses for this month
            one_time_expenses = await self.expense_repository.get_one_time_for_month(user.id, month, year)
            total_one_time_expenses = sum(expense.amount for expense in one_time_expenses)

            # Calculate totals
            total_income = total_monthly_income + total_one_time_income
            total_expenses = total_monthly_expenses + total_one_time_expenses
            surplus_deficit = total_income - total_expenses

            # Calculate savings rate
            savings_rate = 0.0
            if total_income > 0:
                savings_rate = (surplus_deficit / total_income) * 100

            # Calculate expense breakdown by category
            all_expenses = monthly_expenses + one_time_expenses
            category_totals = defaultdict(float)
            for expense in all_expenses:
                category_name = expense.category.name if expense.category else "Uncategorized"
                category_totals[category_name] += expense.amount

            expense_breakdown = [
                ExpenseBreakdownItem(
                    category_name=category,
                    amount=amount,
                    percentage=(amount / total_expenses * 100) if total_expenses > 0 else 0
                )
                for category, amount in category_totals.items()
            ]

            # Sort by amount descending
            expense_breakdown.sort(key=lambda x: x.amount, reverse=True)

            return BudgetSummaryResponse(
                month=month,
                year=year,
                total_income=total_income,
                total_expenses=total_expenses,
                surplus_deficit=surplus_deficit,
                savings_rate=round(savings_rate, 2),
                expense_breakdown=expense_breakdown,
            )
        except Exception as e:
            logger.error(f"Error calculating budget summary: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def calculate_current_month_summary(self, user: User) -> BudgetSummaryResponse:
        """Calculate budget summary for the current month."""
        today = date.today()
        return await self.calculate_monthly_summary(user, today.month, today.year)

    async def calculate_yearly_summary(self, user: User, year: int) -> dict:
        """Calculate budget summary for an entire year."""
        try:
            logger.debug(f"Calculating yearly budget summary for user {user.username} - {year}")

            # Get all income for user
            all_income = await self.income_repository.get_all_for_user(user.id)
            yearly_income = 0.0

            for income in all_income:
                if income.frequency == FrequencyEnum.YEARLY:
                    yearly_income += income.amount
                elif income.frequency == FrequencyEnum.MONTHLY:
                    yearly_income += income.amount * 12
                elif income.frequency == FrequencyEnum.ONE_TIME:
                    if income.effective_year == year:
                        yearly_income += income.amount

            # Get all expenses for user
            all_expenses = await self.expense_repository.get_all_for_user(user.id)
            yearly_expenses = 0.0

            for expense in all_expenses:
                if expense.frequency == FrequencyEnum.YEARLY:
                    yearly_expenses += expense.amount
                elif expense.frequency == FrequencyEnum.MONTHLY:
                    yearly_expenses += expense.amount * 12
                elif expense.frequency == FrequencyEnum.ONE_TIME:
                    if expense.effective_year == year:
                        yearly_expenses += expense.amount

            surplus_deficit = yearly_income - yearly_expenses
            savings_rate = 0.0
            if yearly_income > 0:
                savings_rate = (surplus_deficit / yearly_income) * 100

            return {
                "year": year,
                "total_income": yearly_income,
                "total_expenses": yearly_expenses,
                "surplus_deficit": surplus_deficit,
                "savings_rate": round(savings_rate, 2),
            }
        except Exception as e:
            logger.error(f"Error calculating yearly budget summary: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_trends(self, user: User, months: int = 6) -> BudgetTrendsResponse:
        """Get budget trends over the last N months."""
        try:
            logger.debug(f"Calculating budget trends for user {user.username} - last {months} months")

            today = date.today()
            trends = []

            for i in range(months):
                # Calculate month and year for each period
                month = today.month - i
                year = today.year

                if month <= 0:
                    month += 12
                    year -= 1

                # Get monthly income
                monthly_income = await self.income_repository.get_monthly_income(user.id)
                total_monthly_income = sum(income.amount for income in monthly_income)

                # Get one-time income for this month
                one_time_income = await self.income_repository.get_one_time_for_month(user.id, month, year)
                total_one_time_income = sum(income.amount for income in one_time_income)

                # Get monthly expenses
                monthly_expenses = await self.expense_repository.get_monthly_expenses(user.id)
                total_monthly_expenses = sum(expense.amount for expense in monthly_expenses)

                # Get one-time expenses for this month
                one_time_expenses = await self.expense_repository.get_one_time_for_month(user.id, month, year)
                total_one_time_expenses = sum(expense.amount for expense in one_time_expenses)

                # Calculate totals
                total_income = total_monthly_income + total_one_time_income
                total_expenses = total_monthly_expenses + total_one_time_expenses
                surplus_deficit = total_income - total_expenses

                trends.append(
                    BudgetTrendMonth(
                        month=month,
                        year=year,
                        income=total_income,
                        expenses=total_expenses,
                        surplus_deficit=surplus_deficit,
                    )
                )

            # Reverse to show oldest to newest
            trends.reverse()

            return BudgetTrendsResponse(months=trends)
        except Exception as e:
            logger.error(f"Error calculating budget trends: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
