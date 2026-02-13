from fastapi import HTTPException
from pydantic import UUID4
from nw_tracker.repositories.balance_repository import BalanceRepository
from nw_tracker.repositories.account_repository import AccountRepository
from nw_tracker.models.models import Balance, User
from nw_tracker.models.request_response_models import BalanceCreateRequest, BalanceUpdateRequest, BalanceResponse
from nw_tracker.logger import get_logger

logger = get_logger()


class BalanceService:
    def __init__(self, session):
        self.repository = BalanceRepository(session)
        self.account_repository = AccountRepository(session)

    async def create_balance(self, user: User, account_id: UUID4, balance_data: dict) -> BalanceResponse:
        try:
            # Verify account belongs to user
            if not await self.account_repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            logger.debug(f"Creating balance for account {account_id}")

            new_balance = Balance(
                amount=balance_data["amount"],
                date=balance_data["date"],
                account_uuid=account_id
            )

            balance = await self.repository.create(new_balance)
            logger.debug(f"Balance object created in DB: {balance.id}")

            # Manually construct response to avoid lazy-loading issues
            return BalanceResponse(
                id=balance.id,
                created_at=balance.created_at,
                updated_at=balance.updated_at,
                amount=balance.amount,
                date=balance.date,
                account_uuid=balance.account_uuid
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating balance: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all_balances_for_account(self, user: User, account_id: UUID4) -> list[BalanceResponse]:
        try:
            # Verify account belongs to user
            if not await self.account_repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            balances = await self.repository.get_all_balances_by_account_id(str(account_id))
            return [BalanceResponse.model_validate(balance) for balance in balances]
        except Exception as e:
            logger.error(f"Error retrieving balances: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_balance(self, user: User, account_id: UUID4, balance_id: UUID4) -> BalanceResponse:
        try:
            # Verify account belongs to user
            if not await self.account_repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            balance = await self.repository.get_by_id(balance_id)
            if not balance:
                logger.warning(f"Balance with ID {balance_id} not found")
                raise HTTPException(status_code=404, detail="Balance not found")
            return BalanceResponse.model_validate(balance)
        except Exception as e:
            logger.error(f"Error retrieving balance: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_balance(self, user: User, account_id: UUID4, balance_id: UUID4, balance_update_request: BalanceUpdateRequest) -> BalanceResponse:
        try:
            # Verify account belongs to user
            if not await self.account_repository.account_belongs_to_user(account_id, user.id):
                logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
                raise HTTPException(status_code=403, detail="Account does not belong to user")

            balance = await self.repository.get_by_id(balance_id)
            if not balance:
                logger.warning(f"Balance with ID {balance_id} not found")
                raise HTTPException(status_code=404, detail="Balance not found")

            balance_data = balance_update_request.model_dump()

            # Update the balance object with the new data
            for key, value in balance_data.items():
                setattr(balance, key, value)

            updated_balance = await self.repository.update(balance)
            logger.info(f"Balance with ID {balance_id} updated successfully")

            return BalanceResponse.model_validate(updated_balance)

        except Exception as e:
            logger.error(f"Error updating balance: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_balance(self, user: User, account_id: UUID4, balance_id: UUID4) -> bool:
        # Verify account belongs to user
        if not await self.account_repository.account_belongs_to_user(account_id, user.id):
            logger.warning(f"Account with ID {account_id} does not belong to user {user.username}")
            raise HTTPException(status_code=403, detail="Account does not belong to user")

        if not await self.repository.exists_by_id(balance_id):
            logger.warning(f"Balance with ID {balance_id} not found")
            raise HTTPException(status_code=404, detail="Balance not found")

        try:
            await self.repository.delete_by_id(balance_id)
            logger.info(f"Balance with ID {balance_id} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting balance: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
