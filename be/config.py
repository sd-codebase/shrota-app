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
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "262800"))  # default: 6 months

# Notification settings
NOTIFICATION_MODE = os.getenv("NOTIFICATION_MODE", "development")

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@shrota.in")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Shrota")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# WhatsApp Business API Configuration
WHATSAPP_API_TOKEN = os.getenv("WHATSAPP_API_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "979142805281834")

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
