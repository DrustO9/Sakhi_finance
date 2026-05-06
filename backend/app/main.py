"""Sakhi FastAPI entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import AUDIO_DIR
from app.db import init_db
from app.routers import admin, score
from app.services.psychometric import for_language

app = FastAPI(title="Sakhi", version="0.1.0",
              description="AI-powered alternative credit scoring for Bharat.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "sakhi", "version": "0.1.0"}


@app.get("/api/psychometric/questions")
def psychometric_questions(lang: str = "en"):
    return for_language(lang)


AUDIO_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

app.include_router(score.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")
