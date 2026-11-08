"""
Internal endpoints for Node API to orchestrate ingestion and RAG queries.
Protected by x-internal-secret with constant-time validation and directory containment.
"""
import asyncio
from pathlib import Path
import secrets
from typing import Any
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from app.config import settings
from app.retrieval.parser import DocumentParser
from app.retrieval.chunker import SemanticChunker
from app.retrieval.vector_store import vector_store
from app.providers.ollama import ollama_provider
from app.retrieval.rag_service import rag_service, RagQueryResult


def verify_internal_secret(x_internal_secret: str | None = Header(None)) -> None:
    expected = settings.ai_service_internal_secret
    if not x_internal_secret or not secrets.compare_digest(x_internal_secret, expected):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: invalid internal service secret",
        )


router = APIRouter(
    prefix="/internal",
    tags=["internal"],
    dependencies=[Depends(verify_internal_secret)],
)


class IngestRequest(BaseModel):
    documentId: str
    workspaceId: str
    filePath: str
    filename: str
    mimeType: str


class IngestResponse(BaseModel):
    documentId: str
    chunksIndexed: int
    status: str
    errorMessage: str | None = None


class RagQueryInput(BaseModel):
    workspaceId: str
    query: str
    topK: int = 5
    allowedDocumentIds: list[str] | None = None


def _validate_safe_file_path(file_path_str: str) -> Path:
    target_path = Path(file_path_str).resolve()
    # Ensure file exists
    if not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified file does not exist",
        )
    # Check directory containment within data-local/uploads or workspace root uploads
    upload_root = Path("./data-local/uploads").resolve()
    try:
        target_path.relative_to(upload_root)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal forbidden: file must be located inside data-local/uploads",
        )
    return target_path


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(body: IngestRequest) -> IngestResponse:
    try:
        # Validate path containment
        safe_path = _validate_safe_file_path(body.filePath)

        # Step 1: Parse document
        pages = DocumentParser.parse(safe_path, body.filename)
        if not pages:
            return IngestResponse(
                documentId=body.documentId,
                chunksIndexed=0,
                status="failed",
                errorMessage="Document contains no extractable text",
            )

        # Step 2: Chunk text
        chunker = SemanticChunker(target_chars=1200, overlap_chars=150)
        chunks = chunker.chunk_document(
            document_id=body.documentId,
            workspace_id=body.workspaceId,
            filename=body.filename,
            pages=pages,
        )

        if not chunks:
            return IngestResponse(
                documentId=body.documentId,
                chunksIndexed=0,
                status="failed",
                errorMessage="Failed to segment document into valid chunks",
            )

        # Step 3: Compute embeddings via Ollama
        texts = [c.text for c in chunks]
        embeddings = await ollama_provider.get_embeddings(texts)

        # Step 4: Index into ChromaDB workspace collection (offloaded to thread)
        indexed_count = await asyncio.to_thread(
            vector_store.upsert_chunks,
            workspace_id=body.workspaceId,
            chunks=chunks,
            embeddings=embeddings,
        )

        return IngestResponse(
            documentId=body.documentId,
            chunksIndexed=indexed_count,
            status="indexed",
        )
    except HTTPException as http_err:
        return IngestResponse(
            documentId=body.documentId,
            chunksIndexed=0,
            status="failed",
            errorMessage=http_err.detail,
        )
    except Exception as e:
        return IngestResponse(
            documentId=body.documentId,
            chunksIndexed=0,
            status="failed",
            errorMessage=f"Ingestion processing error: {type(e).__name__}",
        )


@router.post("/rag/query", response_model=RagQueryResult)
async def rag_query(body: RagQueryInput) -> RagQueryResult:
    try:
        result = await rag_service.query(
            workspace_id=body.workspaceId,
            query_text=body.query,
            top_k=body.topK,
            allowed_doc_ids=body.allowedDocumentIds,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query execution failed: {type(e).__name__}",
        )


@router.delete("/documents/{workspace_id}/{document_id}")
async def delete_document_vectors(
    workspace_id: str,
    document_id: str,
) -> dict[str, Any]:
    try:
        await asyncio.to_thread(
            vector_store.delete_document,
            workspace_id=workspace_id,
            document_id=document_id,
        )
        return {"success": True, "documentId": document_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document vectors: {type(e).__name__}",
        )
