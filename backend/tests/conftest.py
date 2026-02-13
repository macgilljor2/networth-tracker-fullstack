"""
Test configuration fixtures.
Uses SQLite in-memory database for fast integration tests.
Each test gets a completely fresh database.
"""
import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport

from nw_tracker.models.models import Base
from nw_tracker.main import app
from nw_tracker.config.database import get_db


@pytest.fixture
async def db_engine():
    """Create a fresh SQLite engine for each test."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Create a fresh database session for each test."""
    async_session_maker = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session


@pytest.fixture
async def test_client(db_session):
    """Create test client with database session override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def authenticated_test_client(db_session):
    """Create authenticated test client with a test user."""
    from nw_tracker.models.models import User
    from nw_tracker.config.security import get_password_hash
    import uuid

    # Create test user with unique data
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"testuser_{unique_id}",
        email=f"test_{unique_id}@example.com",
        password_hash=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create a new client for this test
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        # Login to get tokens
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": f"test_{unique_id}@example.com", "password": "Password123!"},
        )
        assert response.status_code == 200
        tokens = response.json()
        access_token = tokens["access_token"]

        # Set auth header
        client.headers.update({"Authorization": f"Bearer {access_token}"})

        yield client

    app.dependency_overrides.clear()
