# Agent Instructions

Every future AI or coding agent must read these files before inspecting the rest of the codebase:

1. `agent-context/CONTEXT.md`
2. `agent-context/AGENT.md`
3. `agent-context/PLAN.md`

## Update Rules

- Update `agent-context/PLAN.md` after every meaningful coding step.
- Update `agent-context/CONTEXT.md` and `agent-context/AGENT.md` after architecture or feature behavior changes.
- Keep the files short, current, and useful for handoff.

## Implementation Guardrails

- Use latest package versions by default, but keep Next.js pinned to the newest safe `16.1.x` release for Vercel compatibility. Current pin: `16.1.7`.
- Prefer small, typed modules in `lib/` and focused UI components in `components/`.
- Give each file one clear responsibility whenever practical.
- Build reusable components, modals, panels, controls, and renderers instead of packing multiple features into one file.
- Split complex feature UI into small files so an AI agent or human can focus on one specific thing at a time.
- Do not add fake analysis as the main product path.
- If AI keys are absent, use deterministic local logic on real fetched/pasted files instead of invented data.
- Implement full product modules now unless the user explicitly narrows scope.
- When adding analyzer code, build non-AI scanning first, then compressed AI summaries.
- Keep API route responses stable and typed around shared types in `lib/types`.
- Make the UI responsive from the first version.
- Use icons from lucide-react for tool buttons and compact controls.
- Avoid arbitrary code execution for generated UI; render ComponentSpec data only.
- Preserve the three result layers: Graph Mode for technical file connections, Actual App Flow for product/user runtime journeys, and Story Mode for normal-person animated explanation.
- Story Mode must be a literal human problem-solution story, not a file/function summary. It may use AI, but it must fall back to deterministic local story generation based on real analysis.
- Actual App Flow must include a visual animated product/system flow, not only text.
- Generate product-level Actual App Flow before visual specs, so visual nodes come from the app journey instead of technical controllers, routes, or file names.
- Result recovery must upgrade stale browser/server analyses before rendering; do not render localStorage analysis directly if it may contain legacy technical flow/story data.
- Auto AI mode must route different tasks to different configured models when available. Direct provider choices must keep the same pipeline but force one provider.
- Folder agents should stay small and parallel, then merge into a product-level app understanding before story/visual generation.
- Story animation components must remain safe JSON specs rendered by controlled components.
- Dynamic Story and Flow UI must be generated as safe JSON visual specs from analysis facts, then rendered by controlled UI/Three.js components. Do not eval generated code.
- Keep dashboard summary copy short, product-facing, and human-readable. Never render raw AI markdown/table cluster output in the Analysis Summary card.
- Keep Actual App Flow animations inside dedicated UI regions so moving dots/lines never cross text or cards.

## Current Non-Goals

- Do not execute generated TSX in the browser.
- Do not fetch private repositories unless authentication is intentionally added.
- Do not send whole repositories to AI.
