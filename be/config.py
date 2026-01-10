import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://shrota:shrota123@localhost:5432/shrota")

# MongoDB (keep for migration)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "shrota")

# Other settings
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
AUDIO_LIBRARY_DIR = os.getenv("AUDIO_LIBRARY_DIR", "../audio-library/shrota-audio-library")
