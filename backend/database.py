"""database.py — SQLAlchemy engine + session factory."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Connection string ────────────────────────────────────────────────────────
# Adjust user / password / host / port as needed.
DATABASE_URL = "sqlite:///./globalmobility.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
