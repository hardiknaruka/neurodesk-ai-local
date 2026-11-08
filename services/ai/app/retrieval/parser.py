"""
Document parsing engine for NeuroDesk AI.
Supports PDF (via PyMuPDF / fitz), DOCX (python-docx), TXT, and Markdown.
Preserves page indices for exact citation grounding.
"""
from pathlib import Path
from pydantic import BaseModel


class DocumentPage(BaseModel):
    page_number: int
    text: str


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff", ".ico"}
MAX_ALLOWED_PAGES = 200


class DocumentParser:
    @staticmethod
    def parse(file_path: str | Path, filename: str) -> list[DocumentPage]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = path.suffix.lower()
        if not ext and filename:
            ext = Path(filename).suffix.lower()

        # Reject image formats from raw text decoding
        if ext in IMAGE_EXTENSIONS:
            return []

        if ext == ".pdf":
            return DocumentParser._parse_pdf(path)
        elif ext in [".docx", ".doc"]:
            return DocumentParser._parse_docx(path)
        elif ext in [".txt", ".md", ".markdown", ".csv", ".json", ".log"]:
            return DocumentParser._parse_text(path)
        else:
            return []

    @staticmethod
    def _parse_pdf(path: Path) -> list[DocumentPage]:
        pages: list[DocumentPage] = []
        try:
            import fitz  # PyMuPDF

            doc = fitz.open(str(path))
            for i, page in enumerate(doc):
                if i >= MAX_ALLOWED_PAGES:
                    break
                text = page.get_text() or ""
                cleaned = text.strip()
                if cleaned:
                    pages.append(DocumentPage(page_number=i + 1, text=cleaned))
            doc.close()
        except Exception as e:
            # Clear partially extracted pages to prevent duplicate entries on fallback
            pages.clear()
            try:
                import pypdf

                reader = pypdf.PdfReader(str(path))
                for i, page in enumerate(reader.pages):
                    if i >= MAX_ALLOWED_PAGES:
                        break
                    text = page.extract_text() or ""
                    cleaned = text.strip()
                    if cleaned:
                        pages.append(DocumentPage(page_number=i + 1, text=cleaned))
            except Exception as fallback_err:
                raise ValueError(f"Failed to parse PDF {path.name}: {e}; fallback: {fallback_err}")

        return pages

    @staticmethod
    def _parse_docx(path: Path) -> list[DocumentPage]:
        try:
            import docx

            doc = docx.Document(str(path))
            full_text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text.strip())

            content = "\n\n".join(full_text)
            if not content:
                return []
            return [DocumentPage(page_number=1, text=content)]
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX {path.name}: {e}")

    @staticmethod
    def _parse_text(path: Path) -> list[DocumentPage]:
        content = ""
        # Try UTF-8 first, fallback to latin-1
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            try:
                content = path.read_text(encoding="latin-1")
            except Exception as e:
                raise ValueError(f"Failed to read text file {path.name}: {e}")

        cleaned = content.strip()
        if not cleaned:
            return []
        return [DocumentPage(page_number=1, text=cleaned)]

