"""
Health check endpoint for the NeuroDesk AI service.
"""
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.providers.ollama import ollama_provider
from app.retrieval.vector_store import vector_store

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
    # Check Ollama
    ollama_health = await ollama_provider.check_health()
    ollama_status = "ok" if ollama_health.get("status") == "ok" else "degraded"

    # Check ChromaDB
    chroma_status = "ok" if vector_store.client else "error"

    overall_status = "ok" if ollama_status == "ok" and chroma_status == "ok" else "degraded"

    return HealthResponse(
        status=overall_status,
        version="0.0.1",
        timestamp=datetime.now(tz=timezone.utc).isoformat(),
        services={
            "ai_service": ServiceStatus(status="ok"),
            "ollama": ServiceStatus(status=ollama_status, message=f"Active model: {ollama_provider.model}"),
            "chromadb": ServiceStatus(status=chroma_status, message=f"Path: {vector_store.persist_path}"),
            "neo4j": ServiceStatus(status="disabled", message="Phase 3 integration"),
        },
    )
