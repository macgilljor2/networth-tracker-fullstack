# Codebase Review for Test Creation

## Actual Structure

### Models (nw_tracker/models/)
**models.py:**
- Base (declarative_base)
- BaseModelClass - base model with id, created_at, updated_at
- Balance
- Account
- User
- AccountGroup
- UserSettings

**auth_models.py:**
- RefreshToken

### Services (nw_tracker/services/)
**auth_service.py:**
- __init__(session: AsyncSession)
- async register_user(username, email, password) -> User
- async login(email, password) -> tuple[str, str]  # (access_token, refresh_token)
- async refresh_access_token(refresh_token) -> str
- async logout(refresh_token) -> None
- async get_current_user_from_token(token) -> User

**account_service.py:**
- __init__(session)
- async create_account(user, account_data) -> AccountResponse
- async get_all(user) -> list[AccountResponse]
- async get_account(user, account_id) -> AccountResponse
- async update_account(user, account_id, account_data) -> AccountResponse
- async delete_account(user, account_id) -> None

**balance_service.py:**
- __init__(session)
- async create_balance(user, account_id, balance_data) -> BalanceResponse
- async get_all_balances_for_account(user, account_id) -> list[BalanceResponse]
- async get_balance(user, account_id, balance_id) -> BalanceResponse
- async update_balance(user, account_id, balance_id, balance_update_request) -> BalanceResponse
- async delete_balance(user, account_id, balance_id) -> bool

**account_group_service.py:**
- __init__(session)
- async create_account_group(user, account_group_data) -> AccountGroupResponse
- async get_all(user) -> list[AccountGroupResponse]
- async get_account_group(user, account_group_id) -> AccountGroupResponse
- async update_account_group(user, account_group_id, account_group_data) -> AccountGroupResponse
- async delete_account_group(user, account_group_id) -> None
- async get_account_group_with_accounts(user, account_group_id) -> AccountGroupResponseWithAccounts

### Repositories (nw_tracker/repositories/)
**auth_repository.py:**
- RefreshTokenRepository (not AuthRepository!)

**user_repository.py:**
- UserRepository with get_by_email(), exists_by_name()

### Config (nw_tracker/config/)
**security.py** (NOT a class, just functions):
- verify_password(plain_password, hashed_password) -> bool
- get_password_hash(password) -> str
- create_access_token(data, expires_delta) -> str
- create_refresh_token(data) -> str
- decode_access_token(token) -> Optional[dict]
- decode_refresh_token(token) -> Optional[dict]

**dependencies.py:**
- async def get_current_user(token: str, db) -> User
- async def get_current_active_user(current_user) -> User

**database.py:**
- async def get_db() -> AsyncSession (this is the DB dependency)

### Router Structure
**main.py:**
- Imports from nw_tracker.router.api import router
- Uses lifespan for startup/shutdown

**router/api.py:**
- Includes auth router first (public routes)
- Then account, balance, account_group routers (protected)

**router/v1/auth.py:**
- Uses get_db from nw_tracker.config.database
- Uses get_current_user from nw_tracker.config.dependencies
- Routes: /register, /login, /refresh, /logout, /me

## Key Findings

1. **No SecurityConfig class** - security.py has standalone functions, not a class
2. **RefreshTokenRepository not AuthRepository** - my tests used wrong class name
3. **get_db is in config.database**, not nw_tracker.dependencies
4. **get_current_user is in config.dependencies**
5. **AuthService has simple methods** - no create_access_token/validate_access_token methods (those are in security.py)
6. **Main imports:** router from nw_tracker.router.api (not nw_tracker.router.api directly in main)

## What I Did Wrong

1. Assumed SecurityConfig class existed - it's just functions
2. Used wrong repository class names
3. Used wrong import paths for dependencies
4. Created complex test fixtures that don't match actual code
5. Didn't check actual method signatures before writing tests
6. Created AuthService methods that don't exist

## Correct Approach

1. Check actual imports in files before writing tests
2. Use real method signatures
3. Match actual class names
4. Test what actually exists, not what I assume
5. Start with simple integration tests that work
6. Only mock what's necessary (DB connections)
7. Create real instances where possible
