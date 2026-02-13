from typing import List, Optional
from fastapi import HTTPException
from pydantic import UUID4
from uuid import uuid4

from nw_tracker.repositories.account_type_repository import AccountTypeRepository
from nw_tracker.repositories.account_repository import AccountRepository
from nw_tracker.models.models import AccountTypeDefinition, User
from nw_tracker.models.enums_models import EnumValue
from nw_tracker.logger import get_logger

logger = get_logger()


class AccountTypeService:
    """Service for managing account type definitions."""

    def __init__(self, session):
        self.repository = AccountTypeRepository(session)
        self.account_repository = AccountRepository(session)

    async def create_account_type(
        self,
        user: User,
        name: str,
        label: str,
        icon: Optional[str] = None
    ) -> AccountTypeDefinition:
        """Create a custom account type for a user."""
        try:
            logger.debug(f"Creating account type '{name}' for user: {user.username}")

            # Check if name already exists for this user's custom types only
            existing = await self.repository.is_name_exists_for_user(user.id, name)
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"You already have an account type with name '{name}'"
                )

            # Validate name format (lowercase alphanumeric with hyphens)
            if not self._validate_name(name):
                raise HTTPException(
                    status_code=400,
                    detail="Name must be lowercase alphanumeric with hyphens only (e.g., 'crypto-wallet')"
                )

            account_type = AccountTypeDefinition(
                id=uuid4(),
                name=name,
                label=label,
                icon=icon,
                is_default=False,
                user_id=user.id
            )

            created = await self.repository.create(account_type)
            logger.info(f"Account type '{name}' created for user {user.username}")
            return created

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating account type: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def update_account_type(
        self,
        user: User,
        type_id: UUID4,
        label: Optional[str] = None,
        icon: Optional[str] = None
    ) -> AccountTypeDefinition:
        """Update a custom account type (user's only)."""
        try:
            logger.debug(f"Updating account type {type_id} for user: {user.username}")

            account_type = await self.repository.get_by_id(type_id)
            if not account_type:
                raise HTTPException(
                    status_code=404,
                    detail="Account type not found"
                )

            # Verify ownership (can only edit own custom types)
            if account_type.user_id != user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only edit your own custom account types"
                )

            # Can't edit system defaults
            if account_type.is_default:
                raise HTTPException(
                    status_code=403,
                    detail="Cannot edit system default account types"
                )

            if label is not None:
                account_type.label = label
            if icon is not None:
                account_type.icon = icon

            updated = await self.repository.update(account_type)
            logger.info(f"Account type {type_id} updated")
            return updated

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating account type: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def delete_account_type(self, user: User, type_id: UUID4) -> None:
        """Delete a custom account type (user's only, if not in use)."""
        try:
            logger.debug(f"Deleting account type {type_id} for user: {user.username}")

            account_type = await self.repository.get_by_id(type_id)
            if not account_type:
                raise HTTPException(
                    status_code=404,
                    detail="Account type not found"
                )

            # Verify ownership
            if account_type.user_id != user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only delete your own custom account types"
                )

            # Can't delete system defaults
            if account_type.is_default:
                raise HTTPException(
                    status_code=403,
                    detail="Cannot delete system default account types"
                )

            # Check if type is in use by any account
            accounts_with_type = await self.account_repository.get_by_account_type(account_type.name)
            if accounts_with_type:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot delete account type that is in use by {len(accounts_with_type)} account(s)"
                )

            await self.repository.delete(account_type)
            logger.info(f"Account type {type_id} deleted")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting account type: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_all_types(self, user: User) -> List[AccountTypeDefinition]:
        """Get all available account types for a user (system + custom)."""
        try:
            return await self.repository.get_all_for_user(user.id)
        except Exception as e:
            logger.error(f"Error fetching account types: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    def get_types_for_enum(self, types: List[AccountTypeDefinition]) -> List[EnumValue]:
        """Convert account types to enum format for frontend."""
        return [
            EnumValue(
                value=t.name,
                label=t.label
            )
            for t in types
        ]

    def _validate_name(self, name: str) -> bool:
        """Validate account type name format."""
        import re
        # Lowercase alphanumeric with hyphens, 2-50 chars
        pattern = r'^[a-z0-9-]{2,50}$'
        return bool(re.match(pattern, name))
