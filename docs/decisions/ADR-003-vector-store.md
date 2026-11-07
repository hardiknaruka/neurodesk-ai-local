# ADR-003 — Vector Store: ChromaDB

**Date:** 2026-11-07  
**Status:** Accepted  

## Context

The PRD offers ChromaDB and FAISS as alternatives for the local vector store.

## Decision

Use **ChromaDB** in embedded persistent mode as the default. FAISS is an evaluation-only alternative; only one vector backend may be active per environment.

## Consequences

- ChromaDB data lives in `data-local/chroma/` (gitignored).
- No separate daemon is required for local mode.
- Switching to FAISS would require a full re-index.
