from datetime import date
from typing import List, Dict, Optional, TYPE_CHECKING
from nw_tracker.models.models import Account, Currency

if TYPE_CHECKING:
    from nw_tracker.services.exchange_rate_service import ExchangeRateService


async def compute_group_balance_history(
    accounts: List[Account],
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    exchange_rate_service: Optional["ExchangeRateService"] = None
) -> List[Dict]:
    """
    Compute balance history for account group with fill-forward logic.

    Algorithm:
    1. Collect all unique dates from all accounts' balances
    2. Filter by from_date/to_date if provided
    3. For each date (ascending), sum each account's balance:
       - Use balance on that date if exists
       - Else use earliest prior balance (fill-forward)
       - Skip account if no prior balance exists
    4. Return list of {date, total_balance_gbp, total_balance_usd}

    Args:
        accounts: List of Account objects with balances loaded
        from_date: Optional start date filter (inclusive)
        to_date: Optional end date filter (inclusive)

    Returns:
        List of dicts with date, total_balance_gbp, total_balance_usd
    """
    if not accounts:
        return []

    # Step 1: Build account balance maps sorted by date then created_at
    account_balances = {}
    for account in accounts:
        if not account.balances:
            continue
        balances = sorted(account.balances, key=lambda b: (b.date, b.created_at))
        account_balances[account.id] = {
            'currency': account.currency,
            'balances': balances  # [(date, amount), ...]
        }

    if not account_balances:
        return []

    # Step 2: Get all unique dates
    all_dates = set()
    for acc_data in account_balances.values():
        for b in acc_data['balances']:
            all_dates.add(b.date)

    sorted_dates = sorted(all_dates)

    # Step 2.5: Apply date range filters
    if from_date:
        sorted_dates = [d for d in sorted_dates if d >= from_date]
    if to_date:
        sorted_dates = [d for d in sorted_dates if d <= to_date]

    if not sorted_dates:
        return []

    # Step 3: For each date, compute totals with fill-forward
    history = []
    for target_date in sorted_dates:
        total_gbp = 0.0

        for acc_id, acc_data in account_balances.items():
            currency = acc_data['currency']
            balances = acc_data['balances']

            # Find balance for this date (or most recent prior)
            amount = None
            for bal in reversed(balances):  # Check from newest
                if bal.date <= target_date:
                    amount = bal.amount
                    break

            if amount is not None:
                if currency == Currency.GBP:
                    total_gbp += amount
                elif exchange_rate_service:
                    # Convert to GBP
                    amount_gbp = await exchange_rate_service.convert_to_gbp(amount, currency)
                    total_gbp += amount_gbp
                else:
                    # No conversion service, skip non-GBP currencies
                    pass

        history.append({
            'date': target_date,
            'total_balance_gbp': total_gbp
        })

    return history


async def compute_total_balance_history(
    accounts: List[Account],
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    exchange_rate_service: Optional["ExchangeRateService"] = None
) -> List[Dict]:
    """
    Compute total balance history across all accounts with fill-forward logic.

    This is an alias for compute_group_balance_history as the logic is identical.
    The difference is semantic: this is for "all accounts" vs "accounts in a group".

    Args:
        accounts: List of Account objects with balances loaded
        from_date: Optional start date filter (inclusive)
        to_date: Optional end date filter (inclusive)
        exchange_rate_service: Optional service for currency conversion

    Returns:
        List of dicts with date, total_balance_gbp
    """
    return await compute_group_balance_history(accounts, from_date, to_date, exchange_rate_service)
