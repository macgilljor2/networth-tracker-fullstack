from datetime import datetime
from typing import Dict, Optional
import httpx
from fastapi import HTTPException

from nw_tracker.repositories.exchange_rate_repository import ExchangeRateRepository
from nw_tracker.models.models import ExchangeRate, Currency
from nw_tracker.logger import get_logger

logger = get_logger()

# Fallback rates if API fails
FALLBACK_RATES = {
    "GBP": 1.0,
    "USD": 1.25,
    "EUR": 1.15
}

# Class-level cache for exchange rates
_cached_rates: Optional[Dict[str, float]] = None


class ExchangeRateService:
    API_URL = "https://api.exchangerate-api.com/v4/latest/GBP"

    def __init__(self, session):
        self.repository = ExchangeRateRepository(session)

    async def get_rates(self, base_currency: str = "GBP", force_refresh: bool = False) -> Dict[str, float]:
        """
        Get all exchange rates relative to base_currency.
        Fetches fresh rates if they don't exist or are older than 24h.
        """
        try:
            # Check for fresh rates in DB
            if not force_refresh:
                latest_rates = await self.repository.get_latest_rates(base_currency, max_age_hours=24)
                if latest_rates:
                    global _cached_rates
                    rates = {rate.target_currency: rate.rate for rate in latest_rates}
                    logger.info(f"Using cached exchange rates from {latest_rates[0].fetched_at}")
                    _cached_rates = rates
                    return rates

            # Fetch fresh rates from API
            return await self.fetch_and_store_rates(base_currency)
        except Exception as e:
            logger.error(f"Error in get_rates: {e}, using fallback rates")
            return FALLBACK_RATES

    async def fetch_and_store_rates(self, base_currency: str) -> Dict[str, float]:
        """Fetch rates from public API and store in database."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.API_URL, timeout=10.0)
                response.raise_for_status()
                data = response.json()

            if "rates" not in data:
                logger.error(f"Invalid API response: {data}")
                return FALLBACK_RATES

            # Extract rates for currencies we support
            supported_currencies = [curr.value for curr in Currency]
            rates = {}
            for currency, rate in data["rates"].items():
                if currency in supported_currencies and currency != base_currency:
                    rates[currency] = rate

            # Clear old rates and store new ones
            await self.repository.delete_all_by_base(base_currency)
            for target_currency, rate in rates.items():
                from nw_tracker.utils.repository_utils import get_random_uuid
                exchange_rate = ExchangeRate(
                    id=get_random_uuid(),  # Explicitly set UUID to avoid duplicates
                    base_currency=base_currency,
                    target_currency=target_currency,
                    rate=rate,
                    fetched_at=datetime.now()
                )
                await self.repository.create(exchange_rate)

            global _cached_rates
            logger.info(f"Fetched and stored {len(rates)} exchange rates from API")
            _cached_rates = rates
            return rates

        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching exchange rates: {e}")
            # Fall back to last known rates if available
            last_known = await self.repository.get_all_by_base(base_currency)
            if last_known:
                logger.info("Using last known exchange rates from database")
                return {rate.target_currency: rate.rate for rate in last_known}
            return FALLBACK_RATES

        except Exception as e:
            logger.error(f"Error fetching exchange rates: {e}")
            # Fall back to last known rates if available
            last_known = await self.repository.get_all_by_base(base_currency)
            if last_known:
                logger.info("Using last known exchange rates from database")
                return {rate.target_currency: rate.rate for rate in last_known}
            return FALLBACK_RATES

    async def convert_to_gbp(self, amount: float, currency: Currency) -> float:
        """
        Convert amount from given currency to GBP.
        If currency is GBP, returns amount unchanged.
        """
        try:
            if currency == Currency.GBP:
                return amount

            # Get rates if not cached
            global _cached_rates
            if _cached_rates is None:
                _cached_rates = await self.get_rates()

            # Convert: if rate is "1 GBP = X USD", then amount_gbp = amount_usd / rate
            target_currency = currency.value
            if target_currency in _cached_rates:
                rate = _cached_rates[target_currency]
                return amount / rate
            else:
                logger.warning(f"No exchange rate found for {target_currency}, using fallback rate")
                # Use fallback rate
                if target_currency == "USD":
                    return amount / 1.25
                elif target_currency == "EUR":
                    return amount / 1.15
                return amount
        except Exception as e:
            logger.error(f"Error converting {amount} {currency} to GBP: {e}, using fallback")
            # Use fallback conversion
            if currency == Currency.USD:
                return amount / 1.25
            elif currency == Currency.EUR:
                return amount / 1.15
            return amount

    async def get_rate(self, base_currency: str, target_currency: str) -> Optional[float]:
        """Get exchange rate for a specific currency pair."""
        if base_currency == target_currency:
            return 1.0

        rates = await self.get_rates(base_currency)
        return rates.get(target_currency)
