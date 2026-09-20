# TrendTrace AI

This project is a working social intelligence dashboard prototype for the TrendTrace product brief.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind
- Data visualisation: Recharts
- Data fetching: React Query + Axios
- Backend: FastAPI + SQLAlchemy + SQLite
- Real-time updates: WebSocket at `/ws/live`

## Local run

1. Install frontend dependencies: `npm install`
2. Start the backend: `./.venv/Scripts/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`
3. Start the frontend: `npm run dev -- --host 0.0.0.0 --port 5173`
4. Open `http://localhost:5173`

The app supports both `LIVE MODE` and `DEMO MODE`. When no credentials are configured, the dashboard shows `No live source connected` without silently injecting fake source data into the live view.
