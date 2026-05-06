"""SQLite persistence — applications + decisions log for the admin dashboard."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Float, Integer, String, Text, create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DB_PATH

DB_PATH.parent.mkdir(parents=True, exist_ok=True)
ENGINE = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False)
Base = declarative_base()


class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    name = Column(String(120))
    age = Column(Integer)
    dependents = Column(Integer)
    language = Column(String(8), default="en")
    upi_features_json = Column(Text)
    psychometric_json = Column(Text)
    pd_score = Column(Float)
    tier = Column(String(2))
    loan_amount = Column(Integer)
    shap_json = Column(Text)
    counterfactuals_json = Column(Text)
    model_version = Column(String(40), default="lgb-v1")


def init_db() -> None:
    Base.metadata.create_all(bind=ENGINE)


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
