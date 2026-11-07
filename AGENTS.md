# NeuroDesk AI — AGENTS.md
# Antigravity workspace rules — keep at repository root.

## Project layout — keep code in its assigned area

```
neurodesk-ai/
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── .env.example
├── apps/web/                   # Next.js + React + TypeScript + Tailwind
│   ├── app/                    # Routes and layouts (App Router)
│   ├── components/             # Shared visual components
│   ├── features/               # chat/ notebook/ files/ graph/ memory/ settings/
│   ├── hooks/                  # React hooks
│   ├── lib/                    # Browser-safe API client / helpers
│   ├── public/
│   └── tests/
├── services/
│   ├── api/                    # Node.js + Express product API
│   │   └── src/{routes,services,middleware,db}/ + tests/
│   └── ai/                     # Python + FastAPI + LangChain
│       └── app/{agents,providers,retrieval,graph,tools}/ + tests/
├── packages/contracts/          # OpenAPI, JSON schemas, shared TS types
├── docs/                        # PRD, UI_REFERENCE.md, UI_DIRECTION_PROMPT.md, decisions/
├── scripts/                     # Native local setup/start/stop/backup scripts
└── data-local/                  # Gitignored — uploads/ chroma/ backups/
```

## File placement rules

1. Browser UI, client-side state, and visual components **only** in `apps/web/`.  
   Do not put React components in `services/`.
2. Authentication, product APIs, ownership checks, PostgreSQL transactions, and business  
   logic **only** in `services/api/`.
3. Prompts, model routing, LangChain agents, retrieval, embeddings, Neo4j operations,  
   and AI tools **only** in `services/ai/`.
4. Shared API schemas/contracts in `packages/contracts/`. Do not copy-paste request/response  
   types between frontend and backend.
5. Migrations live with the owning database service; tests live beside their owning service  
   under its `tests/` directory. Docs in `docs/`, scripts in `scripts/`, mutable runtime data  
   in `data-local/` (gitignored).
6. Keep the repository root limited to workspace configuration, README, this rule file, and  
   shared developer configuration. No loose application source files at root.
7. Before creating a folder or file, inspect the existing tree and reuse its naming.  
   Do not create duplicate `frontend`, `client`, `backend`, or `server` folders.
8. Make the smallest scoped change that completes the request. Update relevant tests and  
   documentation when a contract changes.
9. Keep secrets out of source control. Add new env vars to `.env.example` with safe  
   placeholders and explain them in README.

## Runtime and architecture invariants

- **No Docker.** Core development and usage must run locally as native processes.  
  Do not create Dockerfiles, docker-compose files, or container manifests.
- Local endpoints:  
  - Web: `127.0.0.1:3000`  
  - Node API: `127.0.0.1:4000`  
  - Python AI service: `127.0.0.1:8000`  
  - PostgreSQL: `127.0.0.1:5432`  
  - Redis: `127.0.0.1:6379`  
  - Neo4j Bolt: `127.0.0.1:7687` / Browser: `127.0.0.1:7474`  
  - Ollama: `127.0.0.1:11434`
- Use **Ollama** as the default local inference provider. HuggingFace Inference API and Groq  
  are optional cloud providers — disabled unless the user explicitly configures them.
- **PostgreSQL** is the canonical relational store. **Redis** is ephemeral cache/job/session.  
  **ChromaDB** is the default local vector store. **Neo4j Community** is the graph store.  
  Local filesystem is the default file store.
- Enforce workspace authorization in the Node API for every user-data operation.  
  The AI service must receive only authorized, scoped requests from the API.
- Keep external connectors (SerpAPI, YouTube Data API, HuggingFace Datasets, Firebase,  
  Resend) behind adapters and disabled by default.
- **Code execution is disabled.** Never execute model-generated code or uploaded content on the host.
- Preserve accessibility, responsive behavior, visible citations/source evidence, and explicit  
  local/cloud model status.

## UI implementation rule

Build the shell and screen patterns in `docs/UI_REFERENCE.md`, following `docs/UI_DIRECTION_PROMPT.md`.  
Keep navigation and shared controls in reusable components; keep feature-specific screens in `apps/web/features/`.  
The default status must say **Local mode · Ollama** when local inference is active.  
Show source citations with assistant answers and provide a readable list alternative for graph visualization.

## Brand palette — do not change

| Token | Value | Use |
|---|---|---|
| Navy | `#152B50` | Navigation, headings, primary text |
| Blue | `#1769AA` | Primary actions, links, selected controls |
| Teal | `#16856B` | Healthy local-service status, secondary emphasis |
| Pale | `#EEF4FA` | Quiet panels, hover surfaces, cards |
| Gray | `#586579` | Secondary labels, metadata |
| Gold | `#D3AA27` | Rare highlight only |
| White | `#FFFFFF` | Reading canvas |

## Before finishing any task

1. Run relevant frontend/API/AI tests and lint/type checks, or report which checks could not run.
2. Confirm changed files remain inside the correct folders and no secret/local database/file  
   data was added to Git.
3. Verify the app still starts locally without cloud keys and without Docker when the change  
   touches startup or configuration.
4. Summarize what changed, list tests run, and call out any remaining decision or limitation.

