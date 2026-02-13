from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from nw_tracker.config.settings import get_settings

settings = get_settings()

# Create async engine with PostgreSQL configuration
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,  # Enable SQL logging in debug mode
    pool_pre_ping=True,   # Verify connections before using
    pool_size=10,         # Connection pool size
    max_overflow=20,      # Max overflow connections
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency for FastAPI to get async database session (RW user)."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_ro_db() -> AsyncSession:
    """Dependency for FastAPI to get async read-only database session (RO user)."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

    ro_engine = create_async_engine(
        settings.ro_database_url,
        echo=settings.debug,
        pool_pre_ping=True,
        pool_size=5,  # Smaller pool for read-only connections
        max_overflow=10,
    )

    ROAsyncSessionLocal = async_sessionmaker(
        bind=ro_engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    async with ROAsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
