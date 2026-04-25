import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False) if DATABASE_URL else None
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False) if engine else None


async def get_db():
    """Database session dependency."""
    if not AsyncSessionLocal:
        raise Exception("Database not configured")
    async with AsyncSessionLocal() as session:
        yield session
