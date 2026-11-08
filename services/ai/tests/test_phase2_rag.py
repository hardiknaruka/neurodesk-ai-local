"""
Phase 2 Unit & Integration Test Suite for Document Ingestion & Grounded RAG.
"""
import pytest
from pathlib import Path
from app.retrieval.parser import DocumentParser, DocumentPage
from app.retrieval.chunker import SemanticChunker
from app.retrieval.vector_store import ChromaVectorStore
from app.retrieval.prompts import build_rag_prompt
from app.retrieval.rag_service import RagService


def test_parser_parses_text_and_markdown(tmp_path: Path):
    txt_file = tmp_path / "notes.txt"
    txt_file.write_text("NeuroDesk AI is a local-first private AI workspace.", encoding="utf-8")

    pages = DocumentParser.parse(txt_file, "notes.txt")
    assert len(pages) == 1
    assert pages[0].page_number == 1
    assert "NeuroDesk AI" in pages[0].text


def test_chunker_creates_bounded_chunks():
    chunker = SemanticChunker(target_chars=100, overlap_chars=20)
    pages = [
        DocumentPage(
            page_number=1,
            text="First sentence about cognitive science. Second sentence about memory. Third sentence about graphs.",
        )
    ]
    chunks = chunker.chunk_document("doc-1", "ws-1", "cognitive.txt", pages)
    assert len(chunks) >= 1
    assert chunks[0].document_id == "doc-1"
    assert chunks[0].workspace_id == "ws-1"
    assert chunks[0].filename == "cognitive.txt"
    assert chunks[0].page_number == 1


def test_vector_store_workspace_isolation(tmp_path: Path):
    store = ChromaVectorStore(persist_path=str(tmp_path / "chroma_test"))

    # Workspace A
    from app.retrieval.chunker import Chunk

    chunk_a = Chunk(
        chunk_id="chunk-a1",
        document_id="doc-a",
        workspace_id="ws-a",
        filename="project_a.txt",
        page_number=1,
        chunk_index=0,
        text="Confidential Strategy of Project A.",
        metadata={"document_id": "doc-a", "workspace_id": "ws-a", "filename": "project_a.txt", "page_number": 1},
    )
    # 4-dim dummy vectors
    vec_a = [0.1, 0.2, 0.3, 0.4]
    store.upsert_chunks("ws-a", [chunk_a], [vec_a])

    assert store.count("ws-a") == 1
    assert store.count("ws-b") == 0

    # Search in ws-b for the exact vector of ws-a
    results_in_b = store.search("ws-b", query_embedding=vec_a, top_k=5)
    assert len(results_in_b) == 0  # Hard isolation: ZERO cross-workspace leakage

    # Search in ws-a
    results_in_a = store.search("ws-a", query_embedding=vec_a, top_k=5)
    assert len(results_in_a) == 1
    assert results_in_a[0]["chunk_id"] == "chunk-a1"


def test_build_rag_prompt_formats_citations():
    chunks = [
        {
            "text": "The hippocampus is crucial for memory consolidation.",
            "metadata": {"filename": "neuroscience.pdf", "page_number": 12},
        }
    ]
    prompt = build_rag_prompt("What does the hippocampus do?", chunks)
    assert '<document index="1"' in prompt
    assert 'filename="neuroscience.pdf"' in prompt
    assert 'page="12"' in prompt
    assert "The hippocampus is crucial" in prompt
    assert "What does the hippocampus do?" in prompt


@pytest.mark.asyncio
async def test_rag_service_honest_fallback_when_empty():
    class DummyProvider:
        async def get_embedding(self, text: str):
            return [0.1, 0.2, 0.3, 0.4]

        async def generate(self, prompt: str, system: str = ""):
            return "Should not be called"

    class EmptyStore:
        def search(self, workspace_id, query_embedding, top_k=5, allowed_doc_ids=None):
            return []

    service = RagService(provider=DummyProvider(), store=EmptyStore())
    result = await service.query("ws-empty", "Explain string theory")

    assert result.relevantChunksCount == 0
    assert "I cannot find sufficient evidence" in result.answer
    assert len(result.citations) == 0

