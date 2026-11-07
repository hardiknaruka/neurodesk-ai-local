# Antigravity UI Direction Prompt — NeuroDesk AI

Paste the following instruction into Antigravity when planning or implementing the NeuroDesk frontend.

```markdown
You are building NeuroDesk AI, a functional local-first AI notebook, chat, memory, file library, and knowledge-graph workspace. Read AGENTS.md, the PRD, the UI reference, and this direction prompt before changing the UI. Work only in the PRD-approved scope and keep all frontend code under apps/web/. Do not implement backend code in this task unless explicitly asked.

## Design goal
Build a calm, editorial productivity workspace with clear hierarchy, practical whitespace, fine dividers, reusable cards/chips, compact metadata, and one focused task/content surface. This is a working app — not a marketing landing page and not a recreation of any source website.
Preserve the existing shell: stable workspace sidebar, top bar, central feature surface, and contextual source panel. Keep citations, local-model status, and privacy cues visible.

## Keep this palette exactly
- Navy #152B50 : structural navigation and primary text.
- Blue #1769AA : primary actions, links, selected controls.
- Teal #16856B : healthy local-service state and secondary semantic emphasis.
- Pale #EEF4FA : quiet panels, contextual cards, subtle hover surfaces.
- Gray #586579 : metadata and secondary text.
- Gold #D3AA27 : rare highlight only.
- White #FFFFFF : reading canvas.

Do not add or substitute brand colors. In particular, do not import the references' black/bronze/sapphire, burnt-orange, cyan/black, tennis-brand, dark teal gradient, or pink palettes. Error/destructive states may use conventional accessible semantic color only when needed, not as a brand accent.

## Use the five recreation briefs selectively
1. Laocoön: use its editorial content hierarchy, alignment grid, thin dividers, and quiet progress feedback. Do not use its cinematic statue scene, WebGL, particles, custom cursor, or scroll-bound narrative.
2. Lumora: use responsive spacing, modular cards/chips, grouped content, and selective contrast. Do not copy its agency/portfolio landing page, burnt-orange brand, pointer-painted photo reveal, or loader-gated access.
3. KIMI / GRIDO1: use compact identity/metadata rows and the idea of a technical-map visualization for knowledge-graph exploration. Do not copy racing branding, cyan palette, pinned page stacks, circuit spectacle, or WebGL effects.
4. Baseline: use the concise heading + context + primary-action hierarchy, scannable ordered rows, useful card grouping, and accessible dialog patterns. Do not copy the tennis marketing section sequence, testimonials, or global smooth-scroll behavior.
5. Soda: use one clear focal surface and subtle layering for secondary context panels only. Do not copy beverage imagery, 3D objects, flavor carousel, pink accents, or no-scroll layout.

## Screen direction
- Workspace home: use a compact in-app hero (not a full-page marketing hero) with a direct welcome/task headline, one sentence of context, and primary actions such as Start a chat, Add sources, and Open knowledge graph. Below it, show only real-data counts for sources, notes, concepts, and local model health, followed by recent-source cards, recent-activity rows, useful agent/tool actions, and an optional graph preview. Hide metrics when empty; never fabricate counts.
- Chat empty state: workspace title, one short instruction, a few useful suggested actions (summarize sources, compare ideas, create notes, explore a topic), recent source cards, and a persistent composer.
- Chat answer: readable conversation, visible retrieval/tool progress, actionable citation chips (file + page/section), and an honest no-evidence state. Never fabricate sources.
- Context panel: upload dropzone, current source list, processing state, selected citation/memory detail, and local model health.
- Local status: show "Local mode · Ollama" and current model when local inference is active. Cloud inference is Off by default. If a user explicitly enables a cloud provider, identify it and disclose that prompt/context may leave the machine.
- Other routes: notebook list/editor, searchable files/indexing states, graph canvas plus keyboard-accessible list alternative, inspectable/editable memory, and settings/privacy controls.
- Translate references into product UI: portfolio cards can become recent-source cards; service rows can become agent/tool or indexing-job rows; progress meters can show actual ingestion/task progress; technical maps can inspire a labeled graph view; pill CTAs can become compact quick actions. Use a carousel only for a genuinely ordered, small set; use ordinary lists otherwise. Do not add testimonials, partner logos, marketing metrics, or decorative contact CTAs.

## Interaction and quality
Use reusable components and feature folders; do not build one giant page component. Make controls keyboard- and touch-operable, provide semantic labels and visible focus, and keep citations and graph relationships readable. Keep animation brief, optional, and subordinate; honor prefers-reduced-motion and provide static equivalents. Retain native cursor, browser scrolling, text selection, and scrollbars. No scroll hijacking, forced cursors, auto-playing 3D/WebGL, permanent floating decoration, or loader that blocks the workspace. Reflow side panels into drawers/tabs on small screens without horizontal scrolling.

## Implementation boundaries
Follow AGENTS.md folder ownership and the PRD. Next.js/React/TypeScript/Tailwind only in apps/web/. Do not create a single-file HTML app. Core app must work locally and remain useful without cloud keys or external-service availability. No Docker or container files. First inspect the existing UI and project files, then state the smallest planned change before editing. After implementation, run the relevant checks and summarize changed files and checks.
```
