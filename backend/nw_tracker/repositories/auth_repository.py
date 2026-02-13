from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from nw_tracker.models.auth_models import RefreshToken
from nw_tracker.repositories.base_repository import GenericRepository


class RefreshTokenRepository(GenericRepository[RefreshToken]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RefreshToken)

    async def create_refresh_token(self, token: str, user_id: UUID, expires_at: datetime) -> RefreshToken:
        """Create a new refresh token."""
        refresh_token = RefreshToken(
            id=uuid4(),
            token=token,
            user_id=user_id,
            expires_at=expires_at,
            revoked=False
        )
        return await self.create(refresh_token)

    async def get_valid_token(self, token: str) -> RefreshToken | None:
        """Get a refresh token if it's valid (not expired and not revoked)."""
        refresh_token = await self.get_by_token(token)
        if refresh_token and not refresh_token.revoked and refresh_token.expires_at > datetime.utcnow():
            return refresh_token
        return None

    async def get_by_token(self, token: str) -> RefreshToken | None:
        """Get a refresh token by token string."""
        result = await self.session.execute(
            select(RefreshToken).filter(RefreshToken.token == token)
        )
        return result.scalars().first()

    async def revoke_token(self, token: str) -> bool:
        """Revoke a refresh token."""
        refresh_token = await self.get_by_token(token)
        if refresh_token:
            refresh_token.revoked = True
            await self.session.commit()
            return True
        return False

    async def revoke_all_user_tokens(self, user_id: UUID) -> None:
        """Revoke all refresh tokens for a user."""
        result = await self.session.execute(
            select(RefreshToken).filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
        )
        tokens = result.scalars().all()
        for token in tokens:
            token.revoked = True
        await self.session.commit()

    async def delete_expired_tokens(self) -> int:
        """Delete all expired refresh tokens. Returns count of deleted tokens."""
        result = await self.session.execute(
            select(RefreshToken).filter(RefreshToken.expires_at < datetime.utcnow())
        )
        tokens = result.scalars().all()
        count = len(tokens)
        for token in tokens:
            await self.session.delete(token)
        await self.session.commit()
        return count
