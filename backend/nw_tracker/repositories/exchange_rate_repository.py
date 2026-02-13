from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import UUID4

from nw_tracker.models.models import ExchangeRate
from nw_tracker.repositories.base_repository import GenericRepository
from nw_tracker.logger import get_logger

logger = get_logger()


class ExchangeRateRepository(GenericRepository[ExchangeRate]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ExchangeRate)

    async def get_by_base_and_target(self, base_currency: str, target_currency: str) -> Optional[ExchangeRate]:
        """Get exchange rate by base and target currency."""
        result = await self.session.execute(
            select(ExchangeRate)
            .filter_by(base_currency=base_currency, target_currency=target_currency)
            .order_by(ExchangeRate.fetched_at.desc())
        )
        return result.scalars().first()

    async def get_all_by_base(self, base_currency: str) -> List[ExchangeRate]:
        """Get all exchange rates for a base currency."""
        result = await self.session.execute(
            select(ExchangeRate)
            .filter_by(base_currency=base_currency)
        )
        return list(result.scalars().all())

    async def get_latest_rates(self, base_currency: str, max_age_hours: int = 24) -> List[ExchangeRate]:
        """Get exchange rates for a base currency that are less than max_age_hours old."""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        result = await self.session.execute(
            select(ExchangeRate)
            .filter_by(base_currency=base_currency)
            .filter(ExchangeRate.fetched_at >= cutoff_time)
        )
        return list(result.scalars().all())

    async def delete_by_base_and_target(self, base_currency: str, target_currency: str) -> bool:
        """Delete exchange rate by base and target currency."""
        result = await self.session.execute(
            delete(ExchangeRate)
            .filter_by(base_currency=base_currency, target_currency=target_currency)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def delete_all_by_base(self, base_currency: str) -> int:
        """Delete all exchange rates for a base currency."""
        result = await self.session.execute(
            delete(ExchangeRate)
            .filter_by(base_currency=base_currency)
        )
        await self.session.commit()
        return result.rowcount
