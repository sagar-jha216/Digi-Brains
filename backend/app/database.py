from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.core.config import settings

# `DATABASE_URL` now drives the active database.
# Examples:
# - mysql+pymysql://root:password@127.0.0.1:3306/digibrain_db
# - postgresql+psycopg://postgres:password@localhost:5432/aibrandbrain
# - sqlite:///./app.db
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://") and "+" not in database_url.split("://", 1)[0]:
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine_kwargs = {"pool_pre_ping": True}
if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(database_url, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
