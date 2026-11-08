"""
ChromaDB Vector Store for NeuroDesk AI.
Implements strict workspace-isolated vector collections.
"""
from pathlib import Path
from typing import Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.retrieval.chunker import Chunk


class ChromaVectorStore:
    def __init__(self, persist_path: str | None = None) -> None:
        self.persist_path = Path(persist_path or settings.chroma_data_path)
        self.persist_path.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=str(self.persist_path),
            settings=ChromaSettings(anonymized_telemetry=False, is_persistent=True),
        )

    def _get_collection_name(self, workspace_id: str) -> str:
        # Chroma collection names must be 3-63 characters, start/end with alphanumeric
        sanitized = workspace_id.replace("-", "_")
        return f"ws_{sanitized}"

    def get_or_create_collection(self, workspace_id: str) -> Any:
        name = self._get_collection_name(workspace_id)
        # Cosine distance metric for normalized embeddings
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine", "workspace_id": workspace_id},
        )

    def upsert_chunks(
        self,
        workspace_id: str,
        chunks: list[Chunk],
        embeddings: list[list[float]],
    ) -> int:
        if not chunks:
            return 0

        collection = self.get_or_create_collection(workspace_id)

        ids = [c.chunk_id for c in chunks]
        documents = [c.text for c in chunks]
        metadatas = [c.metadata for c in chunks]

        # Batch in chunks of 50 for Chroma stability
        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            end = i + batch_size
            collection.upsert(
                ids=ids[i:end],
                embeddings=embeddings[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end],
            )

        return len(chunks)

    def search(
        self,
        workspace_id: str,
        query_embedding: list[float],
        top_k: int = 5,
        allowed_doc_ids: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        collection = self.get_or_create_collection(workspace_id)
        count = collection.count()
        if count == 0:
            return []

        where_filter = None
        if allowed_doc_ids and len(allowed_doc_ids) > 0:
            if len(allowed_doc_ids) == 1:
                where_filter = {"document_id": allowed_doc_ids[0]}
            else:
                where_filter = {"document_id": {"$in": allowed_doc_ids}}

        actual_k = min(top_k, count)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=actual_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        formatted: list[dict[str, Any]] = []
        if not results or not results.get("ids") or len(results["ids"][0]) == 0:
            return formatted

        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0] if results.get("distances") else [0.0] * len(ids)

        for i in range(len(ids)):
            formatted.append(
                {
                    "chunk_id": ids[i],
                    "text": docs[i],
                    "metadata": metas[i],
                    "distance": distances[i],
                    "similarity": max(0.0, 1.0 - distances[i]),
                }
            )

        return formatted

    def delete_document(self, workspace_id: str, document_id: str) -> None:
        collection = self.get_or_create_collection(workspace_id)
        collection.delete(where={"document_id": document_id})

    def count(self, workspace_id: str) -> int:
        collection = self.get_or_create_collection(workspace_id)
        return collection.count()


vector_store = ChromaVectorStore()

