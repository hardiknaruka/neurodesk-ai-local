# ADR-001 — Python AI Service Framework: FastAPI

**Date:** 2026-11-07  
**Status:** Accepted  

## Context

The PRD requires a Python-based AI orchestration service. The architecture diagram names LangChain and LlamaIndex as framework options, but does not specify an HTTP transport layer.

## Decision

Use **FastAPI** as the HTTP transport for the Python service. FastAPI is explicitly named in the PRD as the proposed interface. Use **LangChain** (not LlamaIndex) as the RAG/agent framework for MVP.

## Consequences

- FastAPI provides async-native request handling, automatic OpenAPI docs, and Pydantic validation.
- LangChain is chosen; LlamaIndex is recorded as an alternative and must not be added as a simultaneous dependency.
- A `services/ai` Python package is deployed as a separate process from the Node API.

