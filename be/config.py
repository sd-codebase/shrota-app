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

# Notification settings
NOTIFICATION_MODE = os.getenv("NOTIFICATION_MODE", "development")

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@shrota.in")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Shrota Audiobooks")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
