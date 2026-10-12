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

# Royalty reporting
# Listening is bucketed into local calendar days for payout periods — the
# business runs on this calendar, not UTC.
ROYALTY_TIMEZONE = os.getenv("ROYALTY_TIMEZONE", "Asia/Kolkata")

# Google Play Billing (in-app purchases on Android).
# The service account must be linked in Play Console (Users & permissions)
# with "View financial data" + "Manage orders and subscriptions" (to verify
# and acknowledge purchases) and "Manage store presence" (to create products).
GOOGLE_PLAY_PACKAGE_NAME = os.getenv("GOOGLE_PLAY_PACKAGE_NAME", "com.shrota.app")
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_PLAY_SERVICE_ACCOUNT_PATH", "./secrets/google-play-service-account.json")
# Real-time developer notifications arrive as Pub/Sub push requests carrying
# a Google-signed OIDC token. Set the audience configured on the push
# subscription, and the service account email Pub/Sub signs as.
GOOGLE_PLAY_RTDN_AUDIENCE = os.getenv("GOOGLE_PLAY_RTDN_AUDIENCE", "")
GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT = os.getenv("GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT", "")
# Pricing regions pushed to Play for books and plans (ISO 3166 codes), and
# the Play regions version those codes are valid in.
GOOGLE_PLAY_PRICE_REGIONS = [
    r.strip().upper() for r in os.getenv("GOOGLE_PLAY_PRICE_REGIONS", "IN").split(",") if r.strip()
]
GOOGLE_PLAY_REGIONS_VERSION = os.getenv("GOOGLE_PLAY_REGIONS_VERSION", "2022/02")
# Turn product/plan syncing to Play off (e.g. local dev without credentials).
GOOGLE_PLAY_SYNC_ENABLED = os.getenv("GOOGLE_PLAY_SYNC_ENABLED", "true").lower() == "true"

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
