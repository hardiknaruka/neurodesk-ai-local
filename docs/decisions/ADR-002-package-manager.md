# ADR-002 — JavaScript Package Manager: pnpm

**Date:** 2026-11-07  
**Status:** Accepted  

## Context

The monorepo needs a workspace-aware package manager. The PRD specifies `pnpm-workspace.yaml`.

## Decision

Use **pnpm** (installed via `npm install -g pnpm`). The workspace definition lives in `pnpm-workspace.yaml` at the repo root.

## Consequences

- All JS/TS install commands use `pnpm`, not `npm` or `yarn`.
- Workspace packages reference each other with `workspace:*` protocol.
- `node_modules` is hoisted per pnpm defaults.
