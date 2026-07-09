from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Optician E-Commerce API"
    ENVIRONMENT: str = "development"
    
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_DB: str
    
    # تنظیمات امنیتی (بدون مقدار پیش‌فرض تا حتما از .env خوانده شود)
    SECRET_KEY: str 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 
    
    # تنظیمات داینامیک CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    REDIS_URL: str = "redis://redis:6379/0"
    
    
settings = Settings()