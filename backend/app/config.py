from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized app configuration, loaded from environment variables (.env).
    Using pydantic-settings gives us type validation for free: if DB_PORT
    isn't a valid int in .env, the app fails fast at startup instead of
    failing later with a confusing DB error.
    """

    # MySQL connection settings
    DB_HOST: str
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # Email settings (used by FastAPI-Mail to send OTP emails via SMTP).
    # EMAIL_ENABLED is the single switch between dev mode (OTP printed to
    # console, no real email) and production mode (real SMTP send) — no
    # code changes needed to flip it, just this one .env value.
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@svecw.edu.in"
    SMTP_TLS: bool = True

    # Base URL of the React app — used to build links inside emails
    # (e.g. the admin invitation's "Set Password" link). Change this to
    # your real deployed frontend URL in production.
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # JWT settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def DATABASE_URL(self) -> str:
        # pymysql is the driver; SQLAlchemy uses this URL to connect.
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


# Single shared settings instance, imported wherever config is needed.
settings = Settings()