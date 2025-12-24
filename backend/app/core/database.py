from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Veritabanı motorunu oluştur (Asenkron)
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# Oturum (Session) fabrikası
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()

# Dependency Injection için (API her istekte DB oturumu açar, iş bitince kapatır)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()