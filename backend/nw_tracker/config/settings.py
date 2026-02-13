from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Database Connection
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "nw_tracker"

    # Database Users (3 roles)
    postgres_ddl_user: str = "alembic_user"
    postgres_ddl_password: str = "alembic_password"
    postgres_rw_user: str = "app_user"
    postgres_rw_password: str = "app_password"
    postgres_ro_user: str = "reporting_user"
    postgres_ro_password: str = "reporting_password"

    # Application Settings
    debug: bool = True
    log_level: str = "INFO"

    # JWT Configuration
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_refresh_secret_key: str = "your-refresh-secret-key-change-in-production"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # Password Policy
    password_min_length: int = 8

    @property
    def database_url(self) -> str:
        """Construct async PostgreSQL URL for application (RW user)."""
        return (
            f"postgresql+asyncpg://{self.postgres_rw_user}:{self.postgres_rw_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def ddl_database_url(self) -> str:
        """Construct synchronous PostgreSQL URL for Alembic (DDL user)."""
        return (
            f"postgresql+psycopg2://{self.postgres_ddl_user}:{self.postgres_ddl_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def ro_database_url(self) -> str:
        """Construct async PostgreSQL URL for reporting (RO user)."""
        return (
            f"postgresql+asyncpg://{self.postgres_ro_user}:{self.postgres_ro_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
