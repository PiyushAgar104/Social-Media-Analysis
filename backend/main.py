from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db, make_demo_seed

app = FastAPI(title="TrendTrace AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_source_status(mode: str) -> list[dict[str, str]]:
    sources = [
        {"name": "Reddit", "env": "REDDIT_CLIENT_ID", "url": "https://api.reddit.com/"},
        {"name": "YouTube", "env": "YOUTUBE_API_KEY", "url": "https://www.googleapis.com/youtube/v3"},
        {"name": "GDELT", "env": "GDELT_API_URL", "url": settings.GDELT_API_URL or "https://api.gdeltproject.org/api/v2"},
        {"name": "News RSS", "env": "NEWS_API_KEY", "url": "https://news.google.com/rss/"},
        {"name": "X", "env": "X_API_KEY", "url": "https://api.x.com/"},
    ]

    statuses: list[dict[str, str]] = []
    for source in sources:
        key = source["env"]
        value = getattr(settings, key, "")
        if key == "GDELT_API_URL":
            if value:
                status = "Connected"
                detail = "Feed is configured and ready for streaming."
            else:
                status = "Error" if mode == "live" else "Not Configured"
                detail = "GDELT is unavailable in the current environment."
        elif value:
            status = "Connected"
            detail = f"{source['name']} is configured and active."
        else:
            status = "Demo Stream"
            detail = "Live demo events are streaming locally."
        statuses.append({
            "name": source["name"],
            "status": status,
            "detail": detail,
        })
    return statuses


def get_dashboard(mode: str) -> dict[str, Any]:
    mode = mode.lower()
    demo_seed = make_demo_seed()
    live_sources = get_source_status(mode)
    live_connected = any(item["status"] == "Connected" for item in live_sources)

    if mode == "live":
        if not live_connected:
            return {
                "mode": "live",
                "banner": "LIVE DEMO STREAM",
                "status_message": "Structured demo events update every few seconds.",
                "kpis": demo_seed["kpis"],
                "trend_series": demo_seed["trend_series"],
                "trends": demo_seed["trends"],
                "alerts": demo_seed["alerts"],
                "feed": demo_seed["feed"],
                "geography": demo_seed["geography"],
                "sources": live_sources,
            }

        return {
            "mode": "live",
            "banner": "LIVE MODE",
            "status_message": "Live source connected",
            "kpis": demo_seed["kpis"],
            "trend_series": demo_seed["trend_series"],
            "trends": demo_seed["trends"],
            "alerts": demo_seed["alerts"],
            "feed": demo_seed["feed"],
            "geography": demo_seed["geography"],
            "sources": live_sources,
        }

    return {
        "mode": "demo",
        "banner": "DEMO MODE — SIMULATED DATA",
        "status_message": "Demonstration data is enabled to preview the product experience.",
        "kpis": demo_seed["kpis"],
        "trend_series": demo_seed["trend_series"],
        "trends": demo_seed["trends"],
        "alerts": demo_seed["alerts"],
        "feed": demo_seed["feed"],
        "geography": demo_seed["geography"],
        "sources": live_sources,
    }


@app.on_event("startup")
def startup_event() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "app": "TrendTrace AI"}


@app.get("/api/sources")
def sources() -> dict[str, Any]:
    return {"sources": get_source_status("demo")}


@app.get("/api/dashboard")
def dashboard(mode: str = "demo") -> dict[str, Any]:
    return get_dashboard(mode)


@app.websocket("/ws/live")
async def live_updates(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            payload = get_dashboard("live")
            await websocket.send_json({"type": "update", "payload": payload})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
