# ADR-004 — No Docker

**Date:** 2026-11-07  
**Status:** Accepted (non-negotiable constraint)  

## Context

The PRD's primary deployment constraint: no Docker or container-based development or deployment.

## Decision

All services run as **native local processes** on the developer's machine. No Dockerfiles, docker-compose files, or container manifests are permitted in this repository.

## Consequences

- Each service (PostgreSQL, Redis, Neo4j, Ollama, Python AI, Node API, Next.js) must be installed and started natively.
- Setup variability is managed through pinned lockfiles, `scripts/`, OS-specific guidance in README, and `.env.example`.
- This decision is permanent for the MVP; any change requires a separate ADR with explicit approval.

