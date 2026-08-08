from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CivicGuard AI"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.oezknuwiteyqpmrevhzh.supabase.co:5432/postgres"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "reports"
    secret_key: str = "change-me-in-production"
    internal_service_token: str = "change-me-internal"
    access_token_expire_minutes: int = 24 * 60
    storage_root: str = "storage"
    public_base_url: str = "http://localhost:8000"
    open_meteo_timeout_seconds: int = 15
    allowed_origins: str = "http://localhost:5173,http://localhost:8501"
    # SMTP settings (optional) - if set, backend will attempt to send notification emails
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    # Extra API key placeholder for external services (do NOT commit real keys)
    extra_api_key: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
