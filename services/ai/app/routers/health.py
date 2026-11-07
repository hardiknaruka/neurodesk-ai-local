"""
Health check endpoint for the NeuroDesk AI service.
"""
import time
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class ServiceStatus(BaseModel):
    status: str
    latency_ms: float | None = None
    message: str | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    services: dict[str, ServiceStatus]


@router.get("/health", response_model=HealthResponse, summary="Service health check")
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version="0.0.1",
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
        services={
            "ai_service": ServiceStatus(status="ok"),
            # Phase 2+: ping Ollama and ChromaDB
            "ollama": ServiceStatus(status="disabled", message="Not yet configured"),
            "chromadb": ServiceStatus(status="disabled", message="Not yet configured"),
            # Phase 3+:
            "neo4j": ServiceStatus(status="disabled", message="Not yet configured"),
        },
    )

