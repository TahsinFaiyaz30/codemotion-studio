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
- Story Mode may use AI for compressed story generation, but it must fall back to deterministic local story generation based on real analysis.
- Story animation components must remain safe JSON specs rendered by controlled components.

## Current Non-Goals

- Do not execute generated TSX in the browser.
- Do not fetch private repositories unless authentication is intentionally added.
- Do not send whole repositories to AI.
