"""
FastAPI application factory for the NeuroDesk AI service.
"""
from contextlib import asynccontextmanager
from typing import AsyncIterator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, internal


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup and shutdown lifecycle."""
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="NeuroDesk AI Service",
        version="0.0.1",
        description="AI orchestration — model routing, RAG, agents, graph queries",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # ── CORS ───────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.node_api_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(internal.router)

    return app


app = create_app()
