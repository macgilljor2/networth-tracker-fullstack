from datetime import date
from typing import Optional
from fastapi import HTTPException
from pydantic import UUID4
from uuid import uuid4
from nw_tracker.repositories.account_repository import AccountRepository
from nw_tracker.repositories.account_group_repository import AccountGroupRepository
from nw_tracker.models.models import Account, AccountGroup, User
from nw_tracker.models.request_response_models import (
    AccountGroupCreateRequest,
    AccountGroupUpdateRequest,
    AccountGroupResponse,
    AccountGroupSummaryResponse,
    AccountGroupWithHistoryResponse,
    AccountInGroup,
    AccountWithBalancesResponse,
    BalanceResponse,
    BalanceHistoryPoint,
    Currency
)
from nw_tracker.logger import get_logger
from nw_tracker.utils.balance_utils import compute_group_balance_history
from nw_tracker.services.exchange_rate_service import ExchangeRateService

logger = get_logger()


class AccountGroupService():

    def __init__(self, session):
        self.repository = AccountGroupRepository(session)
        self.account_repository = AccountRepository(session)
        self.exchange_rate_service = ExchangeRateService(session)

    async def create_account_group(self, user: User, account_group_data: AccountGroupCreateRequest) -> AccountGroupResponse:
        try:
            logger.debug(f"Creating account group for user: {user.username}")

            accounts = []
            account_ids = []
            if len(account_group_data.accounts) > 0:
                for account_id in account_group_data.accounts:
                    account = await self.account_repository.get_by_id(account_id)
                    if not account:
                        logger.warning(f"Account with ID {account_id} does not exist")
                        raise HTTPException(
                            status_code=400,
                            detail=f"Account with ID {str(account_id)} does not exist"
                        )
                    # Verify account belongs to user
                    if account.user_id != user.id:
                        logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                        continue
                    logger.debug(f"Adding account with ID: {account_id}")
                    accounts.append(account)
                    account_ids.append(account.id)

            account_group_data_dict = account_group_data.model_dump()

            account_group_data_dict["user_id"] = user.id
            account_group_data_dict["owner"] = user

            # Always set accounts to avoid lazy-loading issues
            account_group_data_dict["accounts"] = accounts if accounts else []

            logger.debug(f"Creating account group with data: {account_group_data_dict}")

            # Explicitly set ID to avoid UUID conflicts
            account_group_data_dict["id"] = uuid4()
            new_account_group = AccountGroup(**account_group_data_dict)

            logger.debug(f"Account group object created: {new_account_group}")

            account_group = await self.repository.create(new_account_group)

            logger.debug(f"Account group object created in DB: {account_group.id}")

            # Pass UUIDs to avoid serialization issues with circular references
            return AccountGroupResponse(
                id=account_group.id,
                created_at=account_group.created_at,
                updated_at=account_group.updated_at,
                name=account_group.name,
                description=account_group.description,
                user_id=account_group.user_id,
                accounts=account_ids  # Pass UUIDs, not Account objects
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating account group: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all(
        self,
        user: User,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> list[AccountGroupSummaryResponse]:
        """Get all account groups for user with aggregated summary data."""
        try:
            # Load account groups with accounts and balances
            account_groups = await self.repository.get_all_for_user_with_balances(user.id)

            # Construct summary responses with aggregated data
            responses = []
            for ag in account_groups:
                account_count = len(ag.accounts)

                # Calculate total balances - sum the latest balance from each account (converted to GBP)
                total_gbp = 0.0

                for account in ag.accounts:
                    if account.balances:
                        # Get the most recent balance (ordered by date desc, then created_at desc)
                        latest_balance = sorted(account.balances, key=lambda b: (b.date, b.created_at), reverse=True)[0]
                        # Convert to GBP
                        amount_gbp = await self.exchange_rate_service.convert_to_gbp(
                            latest_balance.amount,
                            account.currency
                        )
                        total_gbp += amount_gbp

                # Compute balance history with fill-forward logic
                balance_history_raw = await compute_group_balance_history(
                    list(ag.accounts),
                    from_date=from_date,
                    to_date=to_date,
                    exchange_rate_service=self.exchange_rate_service
                )
                balance_history = [
                    BalanceHistoryPoint(**point) for point in balance_history_raw
                ]

                responses.append(
                    AccountGroupSummaryResponse(
                        id=ag.id,
                        created_at=ag.created_at,
                        updated_at=ag.updated_at,
                        name=ag.name,
                        description=ag.description,
                        account_count=account_count,
                        total_balance_gbp=total_gbp,
                        balance_history=balance_history
                    )
                )

            return responses
        except Exception as e:
            logger.error(f"Error retrieving account groups: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_account_group(
        self,
        user: User,
        account_group_id: UUID4,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None
    ) -> AccountGroupWithHistoryResponse:
        """Get account group by ID with lite account list and balance history."""
        try:
            # Repository eagerly loads accounts and balances in a single query
            account_group = await self.repository.get_by_id_and_user_with_balances(account_group_id, user.id)
            if account_group:
                # Convert to lite account format with latest balance
                account_responses = []
                for account in account_group.accounts:
                    # Get latest balance for this account
                    latest_balance_gbp = 0.0
                    if account.balances:
                        # Get the most recent balance (ordered by date desc, then created_at desc)
                        latest_balance = sorted(account.balances, key=lambda b: (b.date, b.created_at), reverse=True)[0]
                        # Convert to GBP
                        latest_balance_gbp = await self.exchange_rate_service.convert_to_gbp(
                            latest_balance.amount,
                            account.currency
                        )

                    account_responses.append(
                        AccountInGroup(
                            id=account.id,
                            account_name=account.account_name,
                            account_type=account.account_type,
                            currency=account.currency,
                            latest_balance_gbp=latest_balance_gbp
                        )
                    )

                # Compute balance history with fill-forward logic
                balance_history_raw = await compute_group_balance_history(
                    list(account_group.accounts),
                    from_date=from_date,
                    to_date=to_date,
                    exchange_rate_service=self.exchange_rate_service
                )
                balance_history = [
                    BalanceHistoryPoint(**point) for point in balance_history_raw
                ]

                # Calculate total balance and account count
                account_count = len(account_responses)
                total_balance_gbp = sum(acc.latest_balance_gbp for acc in account_responses)

                return AccountGroupWithHistoryResponse(
                    id=account_group.id,
                    created_at=account_group.created_at,
                    updated_at=account_group.updated_at,
                    name=account_group.name,
                    description=account_group.description,
                    user_id=account_group.user_id,
                    accounts=account_responses,
                    balance_history=balance_history,
                    account_count=account_count,
                    total_balance_gbp=total_balance_gbp
                )
            else:
                logger.warning(f"Account group with ID {account_group_id} not found")
                raise HTTPException(status_code=404, detail="Account group not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error retrieving account group: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_account_group(self, user: User, account_group_id: UUID4, account_group_data: AccountGroupUpdateRequest) -> AccountGroupResponse:
        try:
            account_group = await self.repository.get_by_id_and_user(account_group_id, user.id)
            if not account_group:
                logger.warning(f"Account group with ID {account_group_id} does not exist")
                raise HTTPException(status_code=404, detail="Account group not found")
            logger.debug(f"Account group exists, proceeding ...")

            accounts = []
            account_ids = []
            if account_group_data.accounts is not None:
                for account_id in account_group_data.accounts:
                    account = await self.account_repository.get_by_id(account_id)
                    if not account:
                        logger.warning(f"Account with ID {account_id} does not exist")
                        raise HTTPException(status_code=400, detail="Account does not exist")
                    logger.debug(f"Adding account with ID: {account_id}")
                    accounts.append(account)
                    account_ids.append(account.id)

            account_group_data_dict = account_group_data.model_dump()
            # Don't update user_id
            account_group_data_dict.pop("user_id", None)
            account_group_data_dict.pop("accounts", None)

            if accounts:
                account_group_data_dict["accounts"] = accounts

            logger.debug(f"Updating account group with data: {account_group_data_dict}")

            for key, value in account_group_data_dict.items():
                setattr(account_group, key, value)

            updated_account_group = await self.repository.update(account_group)

            # Pass UUIDs to avoid serialization issues with circular references
            return AccountGroupResponse(
                id=updated_account_group.id,
                created_at=updated_account_group.created_at,
                updated_at=updated_account_group.updated_at,
                name=updated_account_group.name,
                description=updated_account_group.description,
                user_id=updated_account_group.user_id,
                accounts=account_ids  # Pass UUIDs, not Account objects
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating account group: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_account_group(self, user: User, account_group_id: UUID4):
        try:
            account_group = await self.repository.get_by_id_and_user(account_group_id, user.id)
            if not account_group:
                logger.warning(f"Account group with ID {account_group_id} does not exist")
                raise HTTPException(status_code=404, detail="Account group not found")
            logger.debug(f"Account group exists, proceeding ...")
            await self.repository.delete(account_group)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting account group: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
