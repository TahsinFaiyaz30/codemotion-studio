# CodeMotion Studio Context

CodeMotion Studio is a Next.js App Router application for turning a GitHub repository into an animated codebase learning and visualization experience. The product goal is to scan repositories safely, stream analysis progress in real time, map AST-derived code connections, explain real application runtime flows, turn the app into normal-person Story Mode, generate matching UI components from a safe JSON spec, and produce prompts for building similar projects.

## Current Build Phase

The project direction has changed: implement the complete working product path now instead of stopping at an initial placeholder first pass.

The app must analyze real public GitHub repositories or manually pasted files, plan large repositories safely, fetch only selected source files, parse code with AST tools, build graph and flow data, render React Flow visualizations, provide Actual App Flow, Story Mode, Flow Theater, and ComponentForge surfaces, and stream real pipeline progress.

No invented repository should be the main product path. If AI API keys are missing, the app should use deterministic local analysis of the fetched/pasted code rather than returning fake data.

## Product Shape

- `/` is the entry experience with repo input and a compact animated code graph preview.
- `/analyze` is the live analysis console with GitHub URL input, mode selection, manual fallback, and streaming progress.
- `/result/[analysisId]` is the visualization dashboard for a stored real analysis result.
- `/history` shows locally saved analysis records.
- `/api/analyze/stream` runs the analyzer pipeline and emits Server-Sent Events from real work.

## Technical Direction

- Framework: Next.js App Router with TypeScript. Next is pinned to `16.1.7` because `16.2.x` has known Vercel issues for this project.
- Styling: Tailwind CSS plus app-level CSS variables.
- Theme: `next-themes` with light, dark, and system support.
- Motion: Framer Motion for focused UI transitions and live progress.
- Icons: lucide-react.
- Graph: `@xyflow/react` for the result graph.
- AI: Gemini is the free-tier default when configured, currently `gemini-3.5-flash`. Groq remains available with `openai/gpt-oss-120b`. Without keys, deterministic local analysis must still operate on real fetched/pasted code.
- Analyzer: real pipeline modules in `lib/scanner/` and `lib/github/`.

## Three Result Layers

- Graph Mode is the developer view: files, imports, APIs, models, services, and technical connections.
- Actual App Flow is the product view: user action -> UI screen -> component/state -> API/backend -> validation/service -> database/external tool -> response -> UI update.
- Story Mode is the normal-person view: what the app is, who uses it, why it exists, and how it works through animated scenes.

## Current Implementation

- `/api/analyze/stream` runs the analyzer pipeline and stores results in server memory, then sends a content-stripped analysis copy in the final SSE event for same-browser recovery.
- `/result/[analysisId]` first tries the server memory cache, then recovers from this browser's saved analysis copy if production memory is cold or routed to another instance.
- Server memory is not durable production storage. Cross-browser, cross-device, or long-lived result URLs still require a database/KV/blob-backed analysis store.
- GitHub analysis fetches metadata, recursive tree data, selected file contents, then parses selected source files.
- Manual fallback parses pasted `path`, `---`, `code` bundles and runs the same planner/parser/synthesis path.
- Huge repo planner scores files, applies count/byte budgets, and records skip reasons.
- ASTMapper extracts imports, exports, components, hooks, API handlers, JSX usage, calls, env vars, DB signals, auth signals, and isolated parser errors.
- Result pages render stored analysis with React Flow nodes, visible graph connections, inspector, Flow Theater, Stack DNA, Prompt Maker, and ComponentForge.
- Result pages now expose Graph Mode, Actual App Flow, and Story Mode as first-class modes.
- `RuntimeFlowSynthesizer` creates real user/application journeys from detected graph nodes, edges, AST facts, feature clusters, and flow candidates.
- `StoryEngine` creates structured `CodebaseStory` scenes from runtime flows and design DNA, using configured AI when available and deterministic local generation otherwise.
- `StoryComponentPlanner` creates safe `StoryAnimationComponentSpec` JSON for scene visuals.
- ComponentForge produces safe ComponentSpec JSON and copyable TSX text; generated TSX is not executed.

## Modularity Direction

- Keep files focused on one main responsibility.
- Prefer reusable components, modals, panels, controls, and renderers over large mixed-purpose files.
- Split feature folders by product surface so future agents can update one specific thing without rereading unrelated UI.
- Keep shared types and pure helpers in `lib/`; keep interactive UI in small client components under `components/`.
- Avoid catch-all files that mix fetching, parsing, rendering, modal state, and styling decisions together.

## Safety Rules

- Do not send a whole repository to AI.
- Do not fetch binary/generated assets for analysis.
- Do not let parser errors crash an analysis.
- Do not eval AI-generated React code in the browser.
- ComponentForge must render safe ComponentSpec JSON with controlled internal UI.
- No arbitrary fake analysis should be returned as the primary product behavior.
