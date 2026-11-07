# NeuroDesk AI — UI Reference for Building

Use this document with `UI_DIRECTION_PROMPT.md` and the PRD when building `apps/web/`.
This is a functional, local-first knowledge-work interface — not a recreation of any reference website. Keep the established NeuroDesk shell and palette unchanged.

## Design direction

Create a calm, editorial productivity workspace with clear typographic hierarchy, generous but practical spacing, fine dividers, restrained reusable cards, and one focused task/content surface.
Preserve the persistent workspace sidebar, top bar, central feature surface, and contextual source panel. Make citations, local-model state, and privacy status visible. Polish should improve orientation and task clarity, not compete with source material.

## Existing NeuroDesk palette — preserve exactly

| Token | Value | Use |
|---|---|---|
| Navy | `#152B50` | Navigation structure, headings, primary text on light backgrounds |
| Blue | `#1769AA` | Primary actions, links, selected controls |
| Teal | `#16856B` | Healthy local-service status and secondary semantic emphasis |
| Pale surface | `#EEF4FA` | Quiet panels, hover surfaces, cards, source context |
| Gray | `#586579` | Secondary labels, metadata, supporting text |
| Gold | `#D3AA27` | Rare highlight only; never a broad surface or competing accent |
| White | `#FFFFFF` | Reading canvas and high-contrast content surfaces |

Do not replace these tokens with the five reference sites' black/bronze, burnt-orange, cyan/black, tennis-club navy scheme, or teal/pink gradients. Do not add new brand colors. Use red only for conventional destructive/error semantics if required, with accessible contrast and no effect on the brand palette.

## Typography and surface language

Use a readable sans-serif system stack for product UI (for example `Inter, system-ui, sans-serif`). If Onest is selected, bundle/self-host it so local/offline use does not depend on Google Fonts. Reserve display weight/size for page or workspace titles; keep buttons, navigation, labels, citations, and metadata compact and readable. Do not copy the source prompts' oversized all-caps editorial faces, cursive display face, or dense all-uppercase racing style.

Use light canvas surfaces with navy structure, blue/teal interactive states, and pale contextual panels. Dark navy may be used as a compact header, status panel, or focused emphasis — not as an entirely separate competing theme. Use borders and spacing before shadows. Avoid translucent glass if it reduces legibility.

## Example: desktop Chat workspace

Keep the desktop workspace in four stable regions:
- **Top bar**: NeuroDesk AI, workspace search, New Chat, and `Local mode · Ollama` status.
- **Sidebar**: Chat, Notebook, Files, Knowledge Graph, collections, Settings, and local health.
- **Central workspace**: task heading, suggested actions, recent-source cards or conversation, and a persistent composer when in Chat.
- **Context panel**: file dropzone, current source list, processing status, local model details, and cloud inference status (Off by default).

Suggested empty-chat actions: Summarize sources, Compare ideas, Create study notes, and Explore a topic. A file card can show its title, file type, page count, and indexing state.

## Example: workspace home hero and overview

Use a compact "hero" inside the app's central column — not a separate full-screen marketing page. Give the user one clear focal message and immediate actions. Below it, use real workspace data to create useful source cards, activity rows, and compact counts.

- **Hero content**: a short welcome/task headline, one sentence of context, and Start a chat, Add sources, and Open knowledge graph actions.
- **Summary strip**: real counts for sources, notes, concepts, plus local model health. Hide counts or use an empty state when no data exists.
- **Recent work**: recent-source cards and recent-activity rows, using truthful file titles and actual status.
- **Knowledge context**: a static or lightly interactive related-concepts preview; no continuously animated 3D scene.

Counts and activity must come from real workspace data. Hide or use an empty-state message when there is no data; never show fabricated metrics. The related-concepts preview is a static or lightly interactive summary, not a continuously animated 3D scene.

## Example: grounded answer state

The center becomes a readable conversation. An answer can show a small activity line such as `Searching your workspace · 3 relevant passages`, then cite sources with actionable chips such as `[Reading.pdf · p. 4]`. Selecting a citation opens its file or extracted passage in the source panel. If retrieval finds no supporting evidence, say so instead of inventing citations. When the model is running locally, keep `Local mode · Ollama` visible. If optional cloud inference is explicitly enabled, identify the selected provider and indicate that context may be sent off-device.

## Main screen patterns

- **Chat**: readable history, a persistent composer, attachment/scope controls, visible source citations, local-model status, and honest no-evidence/error states.
- **Workspace home**: compact hero message with clear actions, a real-count summary strip, recent source cards, recent activity rows, and an optional graph preview. Treat these as task entry points, not promotional content.
- **Notebook**: scannable note list, focused editor, linked source/memory panel, clear saved/unsaved state, and safe create/delete actions.
- **Files**: searchable files with type, indexing state, date, retry/remove actions, progress, and an accessible upload/drop zone.
- **Knowledge Graph**: labeled graph view with search/filter, selected-node details and citations in the context panel, plus keyboard-accessible entity/relation list.
- **Memory**: user-visible proposed/saved memory, source/provenance, edit/delete controls, and clear consent/settings.
- **Settings**: profile/preferences, local service health, local model choice, memory/privacy controls, and optional provider setup; cloud stays Off by default.

Translate the reference-site components into product components only where useful: portfolio cards become recent-source cards; service rows become agent/tool or indexing-job rows; a progress meter becomes document-ingestion or task progress; a technical map becomes the knowledge-graph canvas; a carousel becomes an explicit model/view selector only if there are a few genuine options. Do not add testimonials, partner logos, marketing stats, or decorative contact CTAs.

Use carousels only when users need to browse genuinely ordered items. Otherwise use an ordinary list or card grid. Use dialogs for focused operations such as source import only; include labels, visible close action, keyboard focus management, Escape behavior, and restored focus.

## Component starting point

```
AppShell
├── WorkspaceSidebar
│   ├── WorkspaceSwitcher
│   ├── PrimaryNavigation
│   ├── CollectionList
│   └── LocalStatusBadge
├── WorkspaceHeader
│   ├── GlobalSearch
│   ├── NewChatButton
│   └── ModelStatus
├── MainContent
│   ├── ChatView | NotebookView | FilesView | GraphView | SettingsView
│   └── ChatComposer (chat route only)
└── ContextPanel
    ├── UploadDropzone
    ├── SourceList
    ├── CitationDetail
    └── LocalModelCard
```

## Selective inspiration from the five supplied website prompts

| Reference prompt | Adapt into NeuroDesk | Do not copy |
|---|---|---|
| **Laocoön — Bronze and Time** | Editorial content hierarchy, fine alignment grid/dividers, small progress feedback, room around a featured note or answer | Bronze/sapphire palette, statue imagery, WebGL, particles, custom cursor, long fixed scroll narrative |
| **Lumora — Design & Engineering Studio** | Responsive spacing, modular cards and chips, grouped content, selective light/dark contrast, calm hover/focus behavior | Burnt orange, agency/portfolio marketing sections, pointer-painted image reveal, loader-gated access |
| **KIMI / GRIDO1 Racing Systems** | Compact identity/metadata rows, strong section labels, optional technical-map feel for graph visualization | Cyan/black racing palette, F1 content, pinned/receding page stack, elaborate WebGL/circuit effects |
| **Baseline — Tennis Club & Academy** | Clear heading + context + primary action, ordered rows, useful card groupings, accessible dialog patterns | Tennis branding, testimonials/programs landing page sequence, global smooth-scroll/loader behavior |
| **Soda** | One clear focal surface, subtle layering for context cards, concise secondary panel | Pink/teal gradients, beverage imagery, floating 3D objects, flavor carousel, no-scroll layout |

## Motion, interaction, and accessibility rules

- Keep motion brief, optional, and useful for selection, content arrival, indexing, or panel transitions. Never delay access to core content behind an intro loader.
- Respect `prefers-reduced-motion`; give every animated state a static equivalent. Do not tie reading, navigation, graph use, or task completion to scroll position or pointer motion.
- Keep native scrolling, cursor, text selection, and scrollbars. Do not add scroll hijacking, forced cursors, global scroll locking, or full-page pinned stacks.
- Use fine lines and decorative details as pointer-transparent layers. Do not obstruct selecting text, links, controls, or graph nodes.
- Provide keyboard and touch operation, visible `:focus-visible` states, semantic headings/status, accessible names, readable contrast, and a text/list alternative for graph content.
- Reflow sidebars/panels into drawers or tabs on small screens. Keep the composer reachable and citations readable without horizontal scrolling.

## Component ownership

The app shell and shared visual elements live in `apps/web/components/`. Feature views and their local components live under `apps/web/features/chat/`, `notebook/`, `files/`, `graph/`, `memory/`, and `settings/`. Keep routes/layouts in `apps/web/app/`; shared browser-safe tokens/API helpers in `apps/web/lib/`. Do not put React UI in either backend service. See `AGENTS.md` for the full folder ownership tree and local runtime rules.
