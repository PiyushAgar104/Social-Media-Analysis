from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


class SourceStatusModel(Base):
    __tablename__ = "source_status"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    detail = Column(String, nullable=False)
    last_checked = Column(DateTime, default=datetime.utcnow)


class FeedItemModel(Base):
    __tablename__ = "feed_items"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    external_id = Column(String, index=True)
    author = Column(String, nullable=True)
    title = Column(String, nullable=False)
    text = Column(String, nullable=True)
    url = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    language = Column(String, default="en")
    content_type = Column(String, default="social")
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    views = Column(Integer, default=0)
    location = Column(String, nullable=True)
    raw_metadata = Column(JSON, default=dict)


class TrendModel(Base):
    __tablename__ = "trends"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    source = Column(String, default="multi")
    volume = Column(Float, default=0.0)
    sentiment = Column(Float, default=50.0)
    risk = Column(Float, default=0.0)
    velocity = Column(Float, default=0.0)
    signal = Column(String, default="watch")
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    source = Column(String, default="system")
    created_at = Column(DateTime, default=datetime.utcnow)


def get_engine():
    connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    return create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)


engine = get_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def make_demo_seed() -> dict[str, Any]:
    return {
        "kpis": [
            {"label": "Content signals", "value": "38.6K", "change": "+16.4%", "trend": "up"},
            {"label": "Positive sentiment", "value": "68%", "change": "+4.1%", "trend": "up"},
            {"label": "Misinformation risk", "value": "24%", "change": "-2.8%", "trend": "down"},
            {"label": "Geo coverage", "value": "42 regions", "change": "+7", "trend": "up"},
        ],
        "trend_series": [
            {"time": "00:00", "volume": 500, "sentiment": 58, "risk": 21},
            {"time": "04:00", "volume": 820, "sentiment": 60, "risk": 24},
            {"time": "08:00", "volume": 1200, "sentiment": 64, "risk": 27},
            {"time": "12:00", "volume": 1500, "sentiment": 67, "risk": 29},
            {"time": "16:00", "volume": 1850, "sentiment": 69, "risk": 31},
            {"time": "20:00", "volume": 2150, "sentiment": 72, "risk": 35},
        ],
        "trends": [
            {"name": "#electionwatch", "volume": 14200, "sentiment": 64, "risk": 48, "velocity": 3.9, "signal": "Early surge"},
            {"name": "#greenenergy", "volume": 11800, "sentiment": 72, "risk": 31, "velocity": 3.1, "signal": "Sustained growth"},
            {"name": "#cybersecurity", "volume": 9600, "sentiment": 69, "risk": 46, "velocity": 2.9, "signal": "Watchlist"},
            {"name": "#climatetech", "volume": 8400, "sentiment": 74, "risk": 22, "velocity": 2.6, "signal": "Momentum"},
        ],
        "alerts": [
            {"level": "high", "title": "Narrative acceleration", "summary": "A misinformation cluster around energy policy is expanding across Reddit and news conversations.", "source": "Cross-platform"},
            {"level": "medium", "title": "Regional spike", "summary": "Mentions of grid resilience increased sharply in the Northeast and West Coast.", "source": "Geo intelligence"},
            {"level": "low", "title": "Sentiment shift", "summary": "Brand perception around logistics and supply chains is turning more positive in U.S. audiences.", "source": "Social listening"},
        ],
        "feed": [
            {"source": "Reddit", "author": "u/marketpulse", "title": "Users tracking an unusually fast adoption curve in EV charging capacity discussions", "text": "The volume of discussion is accelerating, and claims are spreading faster across niche communities.", "url": "https://example.com/ev-charging", "timestamp": "2026-09-20T10:24:00Z", "language": "en", "likes": 820, "comments": 110, "shares": 42, "views": 18500, "location": "United States"},
            {"source": "YouTube", "author": "GridSignal", "title": "Policy analysts debate resilience upgrades after recent outages", "text": "New commentary is surfacing across creator channels with rapid engagement growth.", "url": "https://example.com/grid-policy", "timestamp": "2026-09-20T09:40:00Z", "language": "en", "likes": 1760, "comments": 194, "shares": 88, "views": 40200, "location": "Canada"},
            {"source": "Google News", "author": "Reuters", "title": "Energy storage investment heats up as grid operators look to resilience", "text": "Coverage is broadening beyond technical reporting into mainstream business analysis.", "url": "https://example.com/energy-storage", "timestamp": "2026-09-20T08:12:00Z", "language": "en", "likes": 430, "comments": 58, "shares": 26, "views": 11200, "location": "United Kingdom"},
        ],
        "geography": [
            {"region": "North America", "value": 34},
            {"region": "Europe", "value": 26},
            {"region": "Asia", "value": 22},
            {"region": "Middle East", "value": 11},
            {"region": "LATAM", "value": 7},
        ],
    }
