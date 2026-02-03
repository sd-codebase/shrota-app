from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from config import DATABASE_URL
from models import Base

# SQLAlchemy async engine and session
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Initialize database connection.

    Note: Table creation is handled by Alembic migrations.
    Run 'alembic upgrade head' to apply migrations.
    """
    # Verify database connection by testing the engine
    async with engine.begin() as conn:
        pass
    print("PostgreSQL connection established")


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
