"""
Grounded RAG retrieval and synthesis orchestrator for NeuroDesk AI.
"""
import asyncio
from typing import Any
from pydantic import BaseModel
from app.providers.ollama import ollama_provider, OllamaProvider
from app.retrieval.vector_store import vector_store, ChromaVectorStore
from app.retrieval.prompts import GROUNDED_RAG_SYSTEM_PROMPT, build_rag_prompt


class Citation(BaseModel):
    documentId: str
    filename: str
    page: int = 1
    section: str | None = None
    snippet: str


class RagQueryResult(BaseModel):
    answer: str
    citations: list[Citation]
    relevantChunksCount: int


class RagService:
    def __init__(
        self,
        provider: OllamaProvider | None = None,
        store: ChromaVectorStore | None = None,
        min_similarity_threshold: float = 0.2,
    ) -> None:
        self.provider = provider or ollama_provider
        self.store = store or vector_store
        self.min_similarity_threshold = min_similarity_threshold

    async def query(
        self,
        workspace_id: str,
        query_text: str,
        top_k: int = 5,
        allowed_doc_ids: list[str] | None = None,
    ) -> RagQueryResult:
        # Step 1: Embed query vector
        query_vec = await self.provider.get_embedding(query_text)

        # Step 2: Retrieve relevant chunks from workspace collection via worker thread
        chunks = await asyncio.to_thread(
            self.store.search,
            workspace_id=workspace_id,
            query_embedding=query_vec,
            top_k=top_k,
            allowed_doc_ids=allowed_doc_ids,
        )

        # Filter by minimum similarity threshold to prevent hallucinations on unrelated queries
        relevant_chunks = [
            c for c in chunks if c.get("similarity", 0.0) >= self.min_similarity_threshold
        ]

        if not relevant_chunks:
            return RagQueryResult(
                answer="I cannot find sufficient evidence in your workspace documents to answer this question.",
                citations=[],
                relevantChunksCount=0,
            )

        # Step 3: Format grounded prompt
        prompt = build_rag_prompt(query_text, relevant_chunks)

        # Step 4: Synthesize answer via local LLM
        generated_answer = await self.provider.generate(
            prompt=prompt,
            system=GROUNDED_RAG_SYSTEM_PROMPT,
        )

        # Step 5: Construct structured citations from retrieved sources
        citations: list[Citation] = []
        seen_keys = set()

        for c in relevant_chunks:
            meta = c.get("metadata", {})
            doc_id = meta.get("document_id", "")
            filename = meta.get("filename", "Document")
            page = int(meta.get("page_number", 1))
            text = c.get("text", "")

            dedup_key = f"{doc_id}_{page}"
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                snippet = text[:200] + ("..." if len(text) > 200 else "")
                citations.append(
                    Citation(
                        documentId=doc_id,
                        filename=filename,
                        page=page,
                        snippet=snippet,
                    )
                )

        return RagQueryResult(
            answer=generated_answer,
            citations=citations,
            relevantChunksCount=len(relevant_chunks),
        )


rag_service = RagService()

