from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    gemini_api_key: str = ""
    database_url: str = ""
    upstash_redis_url: str = ""
    upstash_redis_token: str = ""
    max_audio_seconds: int = 60
    max_upload_bytes: int = 5 * 1024 * 1024  # 5MB

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
