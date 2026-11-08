"""
Ollama Provider for NeuroDesk AI.
Handles local embedding generation and local LLM completions with connection pooling.
"""
import asyncio
from typing import Any
import httpx
from app.config import settings


class OllamaProvider:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float = 60.0,
    ) -> None:
        self.base_url = (base_url or settings.ollama_host).rstrip("/")
        self.model = model or settings.ollama_default_model
        self.timeout = timeout
        self._limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)

    async def get_embedding(self, text: str, client: httpx.AsyncClient | None = None) -> list[float]:
        """Generate embedding vector for a single text."""
        url = f"{self.base_url}/api/embeddings"
        payload = {"model": self.model, "prompt": text}

        if client is not None:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            embedding = data.get("embedding", [])
            if not embedding:
                raise ValueError(f"Ollama returned empty embedding for model {self.model}")
            return embedding

        async with httpx.AsyncClient(timeout=self.timeout, limits=self._limits) as c:
            response = await c.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            embedding = data.get("embedding", [])
            if not embedding:
                raise ValueError(f"Ollama returned empty embedding for model {self.model}")
            return embedding

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings concurrently with connection pooling."""
        if not texts:
            return []

        sem = asyncio.Semaphore(5)

        async with httpx.AsyncClient(timeout=self.timeout, limits=self._limits) as client:
            async def _embed_with_sem(txt: str) -> list[float]:
                async with sem:
                    return await self.get_embedding(txt, client=client)

            tasks = [_embed_with_sem(t) for t in texts]
            return await asyncio.gather(*tasks)

    async def generate(self, prompt: str, system: str = "") -> str:
        """Generate text completion from Ollama."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=self.timeout, limits=self._limits) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()

    async def check_health(self) -> dict[str, Any]:
        """Check if Ollama is running and model is available."""
        url = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    models = [m.get("name", "") for m in res.json().get("models", [])]
                    is_model_present = any(self.model in m for m in models)
                    return {
                        "status": "ok" if is_model_present else "degraded",
                        "available_models": models,
                        "active_model": self.model,
                        "model_ready": is_model_present,
                    }
                return {"status": "error", "message": f"HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}


ollama_provider = OllamaProvider()
