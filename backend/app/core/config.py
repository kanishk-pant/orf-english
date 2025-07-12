import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://orf_user:orf_password@localhost:5432/orf_assessment"
    
    # AI Model
    WAV2VEC2_MODEL: str = "facebook/wav2vec2-large-960h-lv60-self"
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    AUDIO_DIR: str = "audio"
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ORF Assessment API"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure upload directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, settings.AUDIO_DIR), exist_ok=True) 