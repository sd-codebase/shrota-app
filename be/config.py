import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://shrota:shrota123@localhost:5432/shrota")

# Other settings
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
AUDIO_LIBRARY_DIR = os.getenv("AUDIO_LIBRARY_DIR", "../audio-library/shrota-audio-library")

# JWT Authentication
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
