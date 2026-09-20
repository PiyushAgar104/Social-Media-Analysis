from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./trendtrace.db"
    APP_MODE: str = "demo"
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    YOUTUBE_API_KEY: str = ""
    X_API_KEY: str = ""
    NEWS_API_KEY: str = ""
    GDELT_API_URL: str = ""
    LLM_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
