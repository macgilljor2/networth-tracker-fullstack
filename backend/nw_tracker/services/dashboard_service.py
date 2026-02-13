from datetime import date
from typing import Optional
from fastapi import HTTPException
from collections import defaultdict

from nw_tracker.repositories.account_repository import AccountRepository
from nw_tracker.repositories.account_group_repository import AccountGroupRepository
from nw_tracker.models.models import Account, Currency, User
from nw_tracker.models.request_response_models import (
    DashboardSummaryResponse,
    GroupBalanceSummary,
    AccountTypeDistribution,
    DashboardHistoryResponse,
    GroupHistorySeries,
    BalanceHistoryPoint
)
from nw_tracker.logger import get_logger
from nw_tracker.utils.balance_utils import compute_total_balance_history, compute_group_balance_history
from nw_tracker.services.exchange_rate_service import ExchangeRateService

logger = get_logger()


class DashboardService:

    def __init__(self, session):
        self.account_repository = AccountRepository(session)
        self.group_repository = AccountGroupRepository(session)
        self.exchange_rate_service = ExchangeRateService(session)

    async def get_dashboard_summary(self, user: User) -> DashboardSummaryResponse:
        """Get main dashboard data with totals and distributions."""
        try:
            # Get all accounts with balances
            accounts = await self.account_repository.get_all_for_user(user.id)

            # Calculate total balances (converted to GBP)
            # Filter out accounts excluded from totals for the main total only
            total_gbp = 0.0
            balances_by_type = defaultdict(float)

            for account in accounts:
                if account.balances:
                    latest_balance = max(account.balances, key=lambda b: (b.date, b.created_at))
                    amount = latest_balance.amount

                    # Convert to GBP
                    amount_gbp = await self.exchange_rate_service.convert_to_gbp(amount, account.currency)

                    # Only add to total if not excluded
                    if not account.is_excluded_from_totals:
                        total_gbp += amount_gbp

                    # Always include in account type breakdown
                    balances_by_type[account.account_type] += amount_gbp

            # Get all groups with their latest balances (include all accounts, even excluded ones)
            groups = await self.group_repository.get_all_for_user_with_balances(user.id)
            group_summaries = []

            for group in groups:
                group_gbp = 0.0

                for account in group.accounts:
                    if account.balances:
                        latest_balance = max(account.balances, key=lambda b: (b.date, b.created_at))
                        amount_gbp = await self.exchange_rate_service.convert_to_gbp(
                            latest_balance.amount,
                            account.currency
                        )
                        group_gbp += amount_gbp

                group_summaries.append(
                    GroupBalanceSummary(
                        id=group.id,
                        name=group.name,
                        total_balance_gbp=group_gbp
                    )
                )

            # Calculate balance by account type for pie chart (include all accounts)
            by_account_type = []
            for account_type, balance in balances_by_type.items():
                by_account_type.append(
                    AccountTypeDistribution(
                        account_type=account_type,
                        total_balance_gbp=balance
                    )
                )

            return DashboardSummaryResponse(
                total_balance_gbp=total_gbp,
                groups=group_summaries,
                by_account_type=by_account_type
            )

        except Exception as e:
            logger.error(f"Error retrieving dashboard summary: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_dashboard_history(
        self,
        user: User,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> DashboardHistoryResponse:
        """Get historical data for line graph."""
        try:
            # Get all accounts with balances
            accounts = await self.account_repository.get_all_for_user(user.id)

            # Compute total balance history across all accounts (excluding those marked as excluded)
            # Only filter for total_history, not for group_histories
            non_excluded_accounts = [acc for acc in accounts if not acc.is_excluded_from_totals]

            total_history_raw = await compute_total_balance_history(
                list(non_excluded_accounts),
                from_date=from_date,
                to_date=to_date,
                exchange_rate_service=self.exchange_rate_service
            )
            total_history = [
                BalanceHistoryPoint(**point) for point in total_history_raw
            ]

            # Get all groups and compute their histories (include all accounts, even excluded ones)
            groups = await self.group_repository.get_all_for_user_with_balances(user.id)
            group_histories = []

            for group in groups:
                if not group.accounts:
                    continue

                group_history_raw = await compute_group_balance_history(
                    list(group.accounts),
                    from_date=from_date,
                    to_date=to_date,
                    exchange_rate_service=self.exchange_rate_service
                )

                if group_history_raw:  # Only add if there's history
                    group_histories.append(
                        GroupHistorySeries(
                            group_id=group.id,
                            group_name=group.name,
                            history=[BalanceHistoryPoint(**point) for point in group_history_raw]
                        )
                    )

            return DashboardHistoryResponse(
                total_history=total_history,
                group_histories=group_histories
            )

        except Exception as e:
            logger.error(f"Error retrieving dashboard history: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
