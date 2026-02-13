from fastapi import APIRouter
from nw_tracker.router.v1 import auth, account, balance, account_group, enums, dashboard, account_types

router = APIRouter(
    prefix="/api/v1"
)

# Public routes (no authentication required)
router.include_router(auth.router)
router.include_router(enums.router)

# Protected routes (require authentication)
router.include_router(account.router)
router.include_router(balance.router)
router.include_router(account_group.router)
router.include_router(account_types.router)
router.include_router(dashboard.router)
