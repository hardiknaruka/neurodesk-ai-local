# NeuroDesk AI

A local-first AI knowledge workspace: notebook, grounded chat, memory, knowledge graph, and multi-agent tools — no Docker required.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript + Tailwind |
| Node API | Node.js 22 LTS + Express.js + TypeScript |
| AI Service | Python 3.12+ + FastAPI + LangChain |
| Relational DB | PostgreSQL 16/17 |
| Vector DB | ChromaDB (embedded) |
| Graph DB | Neo4j Community Edition |
| Cache | Redis / Memurai |
| Local LLM | Ollama (Llama 3 8B default) |

## Prerequisites

Install these before running the project:

| Tool | Min version | Install |
|---|---|---|
| Node.js | 22 LTS | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| Python | 3.12+ | https://python.org |
| Git | any recent | https://git-scm.com |
| PostgreSQL | 16 or 17 | https://www.postgresql.org/download/windows/ |
| Redis / Memurai | any | https://www.memurai.com/get-memurai |
| Java JDK | 17+ | https://adoptium.net/ |
| Neo4j Community | 5.x | https://neo4j.com/deployment-center/ |
| Ollama | latest | https://ollama.com |

## Local setup

```powershell
# 1 — Clone and enter the repo
cd "D:\NeuroDesk AI"

# 2 — Install JavaScript dependencies
pnpm install

# 3 — Set up Python AI service
cd services/ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ../..

# 4 — Copy and fill in environment variables
copy .env.example .env
# Edit .env — fill in passwords, JWT secret, etc.

# 5 — Create the PostgreSQL database and user
# (run in psql as superuser)
#   CREATE USER neurodesk_user WITH PASSWORD 'your_password';
#   CREATE DATABASE neurodesk OWNER neurodesk_user;

# 6 — Run database migrations
pnpm --filter services-api db:migrate

# 7 — Start all services (in separate terminals or use scripts/start-all.ps1)
scripts\start-all.ps1
```

## Service startup order

Start services in this order:

1. PostgreSQL (Windows service — starts automatically)
2. Redis / Memurai (Windows service — starts automatically)
3. Neo4j (`neo4j console` or Windows service)
4. Ollama (`ollama serve` — then `ollama pull llama3`)
5. Python AI service: `cd services/ai && .venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000`
6. Node API: `cd services/api && pnpm dev`
7. Next.js web: `cd apps/web && pnpm dev`

## Local endpoints

| Service | URL |
|---|---|
| Web UI | http://127.0.0.1:3000 |
| Node API | http://127.0.0.1:4000 |
| API health | http://127.0.0.1:4000/api/v1/health |
| Python AI | http://127.0.0.1:8000 |
| AI health | http://127.0.0.1:8000/health |
| PostgreSQL | 127.0.0.1:5432 |
| Redis | 127.0.0.1:6379 |
| Neo4j Bolt | 127.0.0.1:7687 |
| Neo4j Browser | http://127.0.0.1:7474 |
| Ollama | http://127.0.0.1:11434 |

## Development scripts

```powershell
pnpm dev           # Start all JS workspaces in dev mode
pnpm build         # Build all packages
pnpm lint          # Lint all packages
pnpm typecheck     # Type-check all packages
pnpm test          # Run all tests
```

## Project structure

```
neurodesk-ai/
├── AGENTS.md               # Antigravity workspace rules
├── README.md               # This file
├── package.json            # Root workspace scripts
├── pnpm-workspace.yaml     # pnpm monorepo config
├── .env.example            # Environment template (safe placeholders)
├── apps/
│   └── web/                # Next.js frontend
├── services/
│   ├── api/                # Node.js + Express API
│   └── ai/                 # Python + FastAPI AI service
├── packages/
│   └── contracts/          # Shared schemas and types
├── docs/                   # PRD, UI reference, decisions
├── scripts/                # Native start/stop/backup scripts
└── data-local/             # Gitignored runtime data
```

## Environment variables

See `.env.example` for all variables with descriptions. Copy to `.env` and fill in secrets.  
Never commit `.env` to source control.

## Security

- All secrets in environment variables only — never in source code
- Workspace authorization enforced on every API operation
- Cloud inference disabled by default — opt-in only
- Code execution disabled
- See `docs/decisions/` for security ADRs

## Troubleshooting

**Ollama won't start:** Try launching the Ollama app from Start Menu. If it fails, update your NVIDIA drivers.  
**PostgreSQL connection refused:** Check the Windows service is running (`Get-Service postgresql*`).  
**Neo4j won't start:** Verify `JAVA_HOME` points to JDK 17+ (`java -version`).

