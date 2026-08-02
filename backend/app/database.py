from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# The engine manages the actual connection pool to MySQL.
# pool_pre_ping=True checks a connection is alive before using it,
# which avoids "MySQL server has gone away" errors on idle connections.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Each request gets its own SessionLocal instance (a "conversation" with the DB).
# autocommit/autoflush are left False so we control exactly when writes happen.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All SQLAlchemy models (User, Student, ...) will inherit from this Base,
# which is how SQLAlchemy knows what tables to create.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a DB session per request and
    guarantees it's closed afterward, even if an error occurs.
    Used later as: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
