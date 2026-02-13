from typing import List, Optional, Union
from pydantic import BaseModel, UUID4, field_serializer, Field, ConfigDict, EmailStr, field_validator
from datetime import datetime, date as DateType

from nw_tracker.models.models import AccountType, Currency


# ============ Authentication Models ============

class RegisterRequest(BaseModel):
    """Request model for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response model for authentication tokens."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds until access token expires


class RefreshRequest(BaseModel):
    """Request model for refreshing access token."""
    refresh_token: str


# ============ User Models ============

class UserMeResponse(BaseModel):
    """Response model for current user info."""
    id: UUID4
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None


class BaseModelClass(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            DateType: lambda v: v.isoformat(),
            bytes: lambda v: v.decode('utf-8')
        },
    )

class BaseResponseClass():
    id: UUID4
    created_at: datetime
    updated_at: datetime


class UserCreateRequest(BaseModelClass):
    email: EmailStr
    username: str

class UserUpdateRequest(BaseModelClass):
    email: Optional[EmailStr]
    username: Optional[str]

class UserResponse(BaseResponseClass, UserCreateRequest):
    pass


# ============ Balance Models ============

class BalanceCreateRequest(BaseModelClass):
    amount: float
    date: DateType
    account_uuid: UUID4

class BalanceCreateInitial(BaseModelClass):
    amount: float
    date: DateType

class BalanceUpdateRequest(BaseModelClass):
    amount: float | None = None
    date: DateType | None = None

class BalanceResponse(BaseResponseClass, BalanceCreateRequest):
    pass


# ============ Account Models ============

class AccountCreateRequest(BaseModelClass):
    account_name: str
    currency: Currency = Field(default=Currency.GBP)
    account_type: str = Field(default="savings")  # Changed from AccountType enum to string
    balances: Optional[List[BalanceCreateInitial]] = Field(default_factory=list)
    groups: Optional[List[UUID4]] = Field(default_factory=list)

class AccountUpdateRequest(BaseModelClass):
    account_name: Optional[str] = None
    currency: Optional[Currency] = None
    account_type: Optional[str] = None  # Changed from AccountType enum to string
    balances: Optional[List[BalanceUpdateRequest]] = Field(default_factory=list)
    groups: Optional[List[UUID4]] = Field(default_factory=list)

class AccountResponseLite(BaseResponseClass, BaseModelClass):
    account_name: str
    currency: Currency = Field(default=Currency.GBP)
    account_type: str = Field(default="savings")  # Changed from AccountType enum to string
    balances: List[BalanceResponse] = Field(default_factory=list)

class AccountStats(BaseModel):
    """Account statistics over various time periods"""
    this_month_change: float = 0.0
    three_month_change_percent: float = 0.0
    six_month_change_percent: float = 0.0
    all_time_change_percent: float = 0.0
    three_month_change_amount: float = 0.0
    six_month_change_amount: float = 0.0
    all_time_change_amount: float = 0.0


class AccountResponse(BaseResponseClass, BaseModelClass):
    account_name: str
    currency: Currency = Field(default=Currency.GBP)
    account_type: str = Field(default="savings")  # Changed from AccountType enum to string
    user_id: UUID4
    current_balance: float = 0.0
    is_excluded_from_totals: bool = False
    stats: Optional[AccountStats] = None


# ============ Account Group Models ============

class AccountGroupCreateRequest(BaseModelClass):
    name: str
    description: str
    accounts: Optional[List[UUID4]] = Field(default_factory=list)

class AccountGroupUpdateRequest(BaseModelClass):
    name: Optional[str]
    description: Optional[str]
    accounts: Optional[List[UUID4]] = Field(default_factory=list)

class AccountGroupResponse(BaseResponseClass, BaseModelClass):
    name: str
    description: str
    user_id: UUID4
    accounts: List[UUID4]

    @field_validator("accounts", mode="before")
    @classmethod
    def serialize_accounts(cls, accounts) -> List[UUID4]:
        if not accounts:
            return []
        # Handle both Account objects and UUIDs
        if hasattr(accounts[0], 'id'):
            # Account objects - extract IDs
            return [account.id for account in accounts]
        else:
            # Already UUIDs
            return accounts

# ============ Balance History Models ============

class BalanceHistoryPoint(BaseModel):
    """Single point in balance history with totals in GBP."""
    date: DateType
    total_balance_gbp: float


class AccountInGroup(BaseModel):
    """Lite account reference for account groups with latest balance."""
    id: UUID4
    account_name: str
    account_type: str  # Changed from AccountType enum to string
    currency: Currency
    latest_balance_gbp: float


# Summary for "get all" - lightweight, aggregated data
class AccountGroupSummaryResponse(BaseModel):
    """Summary response for listing account groups with aggregated data."""
    id: UUID4
    name: str
    description: str
    account_count: int
    total_balance_gbp: float
    balance_history: List[BalanceHistoryPoint] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class AccountGroupWithHistoryResponse(BaseResponseClass, BaseModelClass):
    """Account group with balance history and lite account list."""
    name: str
    description: str
    user_id: UUID4
    accounts: List[AccountInGroup]
    balance_history: List[BalanceHistoryPoint] = Field(default_factory=list)
    account_count: int
    total_balance_gbp: float


# Full account details with balances
class AccountWithBalancesResponse(BaseModel):
    """Full account details with balance history."""
    id: UUID4
    account_name: str
    currency: Currency
    account_type: str  # Changed from AccountType enum to string
    balances: List[BalanceResponse]

# Detailed for "get by id" - full account details with balances
class AccountGroupDetailResponse(BaseResponseClass, BaseModelClass):
    """Detailed response for a single account group with all account details."""
    name: str
    description: str
    user_id: UUID4
    accounts: List[AccountWithBalancesResponse]

class AccountGroupResponseWithAccounts(BaseResponseClass, BaseModelClass):
    name: str
    description: str
    user_id: UUID4
    accounts: Optional[List[AccountResponseLite]] = Field(default_factory=list)


# ============ Dashboard Models ============

class GroupBalanceSummary(BaseModel):
    """Group with its latest total balance."""
    id: UUID4
    name: str
    total_balance_gbp: float


class AccountTypeDistribution(BaseModel):
    """Balance distribution by account type."""
    account_type: str  # Changed from AccountType enum to string
    total_balance_gbp: float


class DashboardSummaryResponse(BaseModel):
    """Main dashboard data with totals and distributions."""
    total_balance_gbp: float
    groups: List[GroupBalanceSummary]
    by_account_type: List[AccountTypeDistribution]


class GroupHistorySeries(BaseModel):
    """Balance history for a single group."""
    group_id: UUID4
    group_name: str
    history: List[BalanceHistoryPoint]


class DashboardHistoryResponse(BaseModel):
    """Historical balance data for line graph."""
    total_history: List[BalanceHistoryPoint]
    group_histories: List[GroupHistorySeries]


# ============ Account Type Definition Models ============

class AccountTypeCreateRequest(BaseModel):
    """Request model for creating a custom account type."""
    name: str = Field(..., min_length=2, max_length=50, pattern="^[a-z0-9-]+$")
    label: str = Field(..., min_length=2, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)


class AccountTypeUpdateRequest(BaseModel):
    """Request model for updating a custom account type."""
    label: Optional[str] = Field(None, min_length=2, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)


class AccountTypeResponse(BaseResponseClass, BaseModel):
    """Response model for account type definition."""
    name: str
    label: str
    icon: Optional[str] = None
    is_default: bool
    user_id: Optional[UUID4] = None
