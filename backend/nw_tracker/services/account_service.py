from fastapi import HTTPException
from pydantic import UUID4
from uuid import uuid4
from datetime import datetime, date, timedelta
from nw_tracker.repositories.account_repository import AccountRepository
from nw_tracker.repositories.account_group_repository import AccountGroupRepository
from nw_tracker.models.models import Account, AccountGroup, Balance, User
from nw_tracker.models.request_response_models import (
    AccountCreateRequest,
    AccountUpdateRequest,
    AccountResponse,
    BalanceResponse,
    AccountGroupResponse,
    AccountStats
)
from nw_tracker.logger import get_logger

logger = get_logger()


class AccountService():

    def __init__(self, session):
        self.repository = AccountRepository(session)
        self.account_group_repository = AccountGroupRepository(session)

    def _calculate_account_stats(self, account: Account) -> AccountStats:
        """Calculate account statistics including changes over different time periods."""
        if not account.balances or len(account.balances) == 0:
            return AccountStats()

        # Sort balances by date then created_at descending
        sorted_balances = sorted(account.balances, key=lambda b: (b.date, b.created_at), reverse=True)
        current_balance = sorted_balances[0].amount
        first_balance = sorted_balances[-1].amount

        # Calculate stats
        stats = AccountStats(
            all_time_change_amount=current_balance - first_balance,
            all_time_change_percent=((current_balance - first_balance) / abs(first_balance) * 100) if first_balance != 0 else 0
        )

        # Calculate 3 month change
        three_months_ago = date.today() - timedelta(days=90)
        three_month_balance = next((b.amount for b in sorted_balances if b.date <= three_months_ago), first_balance)
        stats.three_month_change_amount = current_balance - three_month_balance
        stats.three_month_change_percent = ((current_balance - three_month_balance) / abs(three_month_balance) * 100) if three_month_balance != 0 else 0

        # Calculate 6 month change
        six_months_ago = date.today() - timedelta(days=180)
        six_month_balance = next((b.amount for b in sorted_balances if b.date <= six_months_ago), first_balance)
        stats.six_month_change_amount = current_balance - six_month_balance
        stats.six_month_change_percent = ((current_balance - six_month_balance) / abs(six_month_balance) * 100) if six_month_balance != 0 else 0

        # Calculate this month's change (from first balance of previous month)
        today = date.today()
        first_of_month = date(today.year, today.month, 1)
        last_month_first = date(today.year, today.month - 1, 1) if today.month > 1 else date(today.year - 1, 12, 1)

        this_month_balances = [b for b in sorted_balances if b.date >= first_of_month]
        last_month_balances = [b for b in sorted_balances if last_month_first <= b.date < first_of_month]

        if this_month_balances and last_month_balances:
            this_month_latest = this_month_balances[0].amount
            last_month_latest = last_month_balances[0].amount
            stats.this_month_change = this_month_latest - last_month_latest

        return stats


    async def create_account(self, user: User, account_data: AccountCreateRequest) -> AccountResponse:
        try:
            logger.debug(f"Creating account for user: {user.username}")

            balances = []
            groups = []

            if len(account_data.balances) > 0:
                for balance in account_data.balances:
                    balance_data = balance.model_dump()
                    balance_data["id"] = uuid4()  # Explicitly set unique ID
                    logger.debug(f"Creating balance with data: {balance_data}")
                    balances.append(Balance(**balance_data))

            if len(account_data.groups) > 0:
                for group_id in account_data.groups:
                    group = await self.account_group_repository.get_by_id(group_id)
                    logger.debug(f"Adding group with ID: {group_id}")
                    groups.append(AccountGroup(group))


            account_data_dict = account_data.model_dump()

            account_data_dict["user_id"] = user.id

            # Always set relationships to avoid lazy loading issues
            account_data_dict["balances"] = balances if balances else []
            account_data_dict["groups"] = groups if groups else []

            logger.debug(f"Creating account with data: {account_data_dict}")

            # Explicitly set ID to avoid UUID conflicts
            account_data_dict["id"] = uuid4()
            new_account = Account(**account_data_dict)

            logger.debug(f"Account object created: {new_account}")

            account = await self.repository.create(new_account)

            # Refresh to get relationships loaded from database
            account = await self.repository.get_by_id_with_relations(account.id)

            # Get the latest balance (most recent date, and most recently created if there are ties)
            current_balance = 0.0
            if account.balances:
                latest_balance = max(account.balances, key=lambda b: (b.date, b.created_at))
                current_balance = latest_balance.amount

            return AccountResponse(
                id=account.id,
                created_at=account.created_at,
                updated_at=account.updated_at,
                account_name=account.account_name,
                currency=account.currency,
                account_type=account.account_type,
                user_id=account.user_id,
                current_balance=current_balance,
                is_excluded_from_totals=account.is_excluded_from_totals
            )

        except Exception as e:
            logger.error(f"Error creating account: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all(self, user: User) -> list[AccountResponse]:
        try:
            # Repository already eager loads balances and groups
            accounts = await self.repository.get_all_for_user(user.id)

            # Construct responses with current balance (latest balance by date)
            response_list = []
            for account in accounts:
                # Get the latest balance (most recent date)
                current_balance = 0.0
                if account.balances:
                    latest_balance = max(account.balances, key=lambda b: (b.date, b.created_at))
                    current_balance = latest_balance.amount

                response_list.append(
                    AccountResponse(
                        id=account.id,
                        created_at=account.created_at,
                        updated_at=account.updated_at,
                        account_name=account.account_name,
                        currency=account.currency,
                        account_type=account.account_type,
                        user_id=account.user_id,
                        current_balance=current_balance,
                        is_excluded_from_totals=account.is_excluded_from_totals
                    )
                )

            return response_list
        except Exception as e:
            logger.error(f"Error retrieving accounts: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_account(self, user: User, account_id: UUID4) -> AccountResponse:
        try:
            # Verify account belongs to user
            if not await self.repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            logger.debug(f"Getting account with ID {account_id}")
            account = await self.repository.get_by_id_and_user(account_id, user.id)

            if not account:
                logger.warning(f"Account with ID {account_id} does not exist")
                raise HTTPException(status_code=404, detail="Account not found")

            # Get the latest balance (most recent date, and most recently created if there are ties)
            current_balance = 0.0
            if account.balances:
                latest_balance = max(account.balances, key=lambda b: (b.date, b.created_at))
                current_balance = latest_balance.amount

            # Calculate stats
            stats = self._calculate_account_stats(account)

            return AccountResponse(
                id=account.id,
                created_at=account.created_at,
                updated_at=account.updated_at,
                account_name=account.account_name,
                currency=account.currency,
                account_type=account.account_type,
                user_id=account.user_id,
                current_balance=current_balance,
                stats=stats,
                is_excluded_from_totals=account.is_excluded_from_totals
            )
        except HTTPException:
            # Re-raise HTTP exceptions (403, 404, etc.)
            raise
        except Exception as e:
            logger.error(f"Error retrieving account: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_account(self, user: User, account_id: UUID4, account_data: AccountUpdateRequest) -> AccountResponse:
        try:
            # Verify account belongs to user
            if not await self.repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            account = await self.repository.get_by_id_with_relations(account_id)
            if not account:
                logger.warning(f"Account with ID {account_id} does not exist")
                raise HTTPException(status_code=404, detail="Account not found")

            # Update the account with the new data (only non-None values)
            # Exclude balances and groups from general update - they should only be modified through create
            update_data = account_data.model_dump(exclude_none=True, exclude={'balances', 'groups'})
            for key, value in update_data.items():
                setattr(account, key, value)

            updated_account = await self.repository.update(account)

            # Refresh to get relationships loaded
            updated_account = await self.repository.get_by_id_with_relations(updated_account.id)

            # Get the latest balance (most recent date)
            current_balance = 0.0
            if updated_account.balances:
                latest_balance = max(updated_account.balances, key=lambda b: (b.date, b.created_at))
                current_balance = latest_balance.amount

            return AccountResponse(
                id=updated_account.id,
                created_at=updated_account.created_at,
                updated_at=updated_account.updated_at,
                account_name=updated_account.account_name,
                currency=updated_account.currency,
                account_type=updated_account.account_type,
                user_id=updated_account.user_id,
                current_balance=current_balance,
                is_excluded_from_totals=updated_account.is_excluded_from_totals
            )
        except HTTPException:
            # Re-raise HTTP exceptions (403, 404, etc.)
            raise
        except Exception as e:
            logger.error(f"Error updating account: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def toggle_exclusion(self, user: User, account_id: UUID4) -> AccountResponse:
        """Toggle whether an account is excluded from total calculations."""
        try:
            # Verify account belongs to user
            if not await self.repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            account = await self.repository.get_by_id_with_relations(account_id)
            if not account:
                logger.warning(f"Account with ID {account_id} does not exist")
                raise HTTPException(status_code=404, detail="Account not found")

            # Toggle the exclusion flag
            account.is_excluded_from_totals = not account.is_excluded_from_totals
            updated_account = await self.repository.update(account)

            # Refresh to get relationships loaded
            updated_account = await self.repository.get_by_id_with_relations(updated_account.id)

            # Get the latest balance (most recent date)
            current_balance = 0.0
            if updated_account.balances:
                latest_balance = max(updated_account.balances, key=lambda b: (b.date, b.created_at))
                current_balance = latest_balance.amount

            return AccountResponse(
                id=updated_account.id,
                created_at=updated_account.created_at,
                updated_at=updated_account.updated_at,
                account_name=updated_account.account_name,
                currency=updated_account.currency,
                account_type=updated_account.account_type,
                user_id=updated_account.user_id,
                current_balance=current_balance,
                is_excluded_from_totals=updated_account.is_excluded_from_totals
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error toggling account exclusion: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_account(self, user: User, account_id: UUID4) -> None:
        try:
            # Verify account belongs to user
            if not await self.repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            logger.debug(f"Deleting account with ID {account_id}")
            account = await self.repository.get_by_id(account_id)
            if not account:
                logger.warning(f"Account with ID {account_id} does not exist")
                raise HTTPException(status_code=404, detail="Account not found")
            await self.repository.delete(account)

            return account

        except Exception as e:
            logger.error(f"Error deleting account: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
