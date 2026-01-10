from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from config import DATABASE_URL
from models import Base

# SQLAlchemy async engine and session
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables in the database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("PostgreSQL tables created")


async def close_db():
    """Close the database connection."""
    await engine.dispose()
    print("Closed PostgreSQL connection")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# MongoDB connection (keep for migration)
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, DATABASE_NAME

mongo_client: AsyncIOMotorClient = None
mongo_db = None


async def connect_to_mongo():
    """Connect to MongoDB (for migration only)."""
    global mongo_client, mongo_db
    mongo_client = AsyncIOMotorClient(MONGODB_URL)
    mongo_db = mongo_client[DATABASE_NAME]
    print(f"Connected to MongoDB: {DATABASE_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("Closed MongoDB connection")


def get_mongo_database():
    """Get MongoDB database (for migration only)."""
    return mongo_db
