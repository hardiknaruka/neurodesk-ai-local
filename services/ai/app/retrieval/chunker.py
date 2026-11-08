"""
Semantic recursive text chunker for NeuroDesk AI.
Maintains page indices, filename, and workspace scope for exact citation provenance.
"""
from typing import Any
from pydantic import BaseModel
from app.retrieval.parser import DocumentPage


class Chunk(BaseModel):
    chunk_id: str
    document_id: str
    workspace_id: str
    filename: str
    page_number: int
    chunk_index: int
    text: str
    metadata: dict[str, Any] = {}


class SemanticChunker:
    def __init__(self, target_chars: int = 1200, overlap_chars: int = 150) -> None:
        self.target_chars = target_chars
        self.overlap_chars = overlap_chars

    def chunk_document(
        self,
        document_id: str,
        workspace_id: str,
        filename: str,
        pages: list[DocumentPage],
    ) -> list[Chunk]:
        all_chunks: list[Chunk] = []
        global_index = 0

        for page in pages:
            raw_text = page.text.strip()
            if not raw_text:
                continue

            # Split text on page
            page_segments = self._split_text(raw_text)
            for seg in page_segments:
                cleaned_seg = seg.strip()
                if not cleaned_seg:
                    continue

                chunk_id = f"{document_id}_p{page.page_number}_c{global_index}"
                all_chunks.append(
                    Chunk(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        workspace_id=workspace_id,
                        filename=filename,
                        page_number=page.page_number,
                        chunk_index=global_index,
                        text=cleaned_seg,
                        metadata={
                            "document_id": document_id,
                            "workspace_id": workspace_id,
                            "filename": filename,
                            "page_number": page.page_number,
                            "chunk_index": global_index,
                        },
                    )
                )
                global_index += 1

        return all_chunks

    def _split_text(self, text: str) -> list[str]:
        if len(text) <= self.target_chars:
            return [text]

        # Recursive splitting separators
        separators = ["\n\n", "\n", ". ", "! ", "? ", "; ", " ", ""]
        return self._recursive_split(text, separators)

    def _recursive_split(self, text: str, separators: list[str]) -> list[str]:
        if len(text) <= self.target_chars or not separators:
            return [text]

        sep = separators[0]
        remaining_seps = separators[1:]

        if sep == "":
            # Hard character slice
            chunks = []
            for i in range(0, len(text), self.target_chars - self.overlap_chars):
                chunks.append(text[i : i + self.target_chars])
            return chunks

        parts = text.split(sep)
        chunks: list[str] = []
        current = ""

        for part in parts:
            candidate = f"{current}{sep}{part}" if current else part
            if len(candidate) <= self.target_chars:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                if len(part) > self.target_chars:
                    # Part itself exceeds target, split with next separators
                    sub_chunks = self._recursive_split(part, remaining_seps)
                    chunks.extend(sub_chunks[:-1])
                    current = sub_chunks[-1] if sub_chunks else ""
                else:
                    current = part

        if current:
            chunks.append(current)

        return chunks

