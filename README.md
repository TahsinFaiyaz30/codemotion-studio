# CodeMotion Studio

Animated AI codebase visualizer built with Next.js App Router.

## First Pass

This version includes:

- Required `agent-context/` handoff files.
- Modular App Router structure.
- Responsive landing, analyze, result, and history pages.
- Real Server-Sent Events analyzer stream.
- GitHub and manual-file analysis path.
- API routes for GitHub, scan, AI, prompt, and ComponentForge surfaces.
- Three result layers: Graph Mode, Actual App Flow, and Story Mode.
- Story Mode scenes and story animation specs are generated from real analysis data without executing generated TSX.

Next is pinned to `16.1.7`; other packages should stay on their latest stable versions unless a deployment issue requires a specific pin.

## Commands

```bash
npm install
npm run dev
npm run build
```
