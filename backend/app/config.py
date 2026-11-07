from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    live_model: str = ""          # Gemini Live model ID from AI Studio
    live_model_backup: str = ""   # fallback Live model ID
    text_model: str = ""          # model for planning / report calls
    allowed_origins: str = "http://localhost:3000"
    token_ttl_minutes: int = 90
    new_session_window_minutes: int = 30  # lobby time before the interview starts


settings = Settings()
