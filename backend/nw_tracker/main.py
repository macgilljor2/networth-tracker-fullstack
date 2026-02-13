from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nw_tracker.config.settings import get_settings
from nw_tracker.router.api import router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Database is managed by Alembic migrations
    # No automatic table creation
    yield
    # Shutdown: Cleanup if needed


app = FastAPI(
    lifespan=lifespan,
    debug=settings.debug,
    title="NW Tracker",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",  # Next.js alternative port
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
