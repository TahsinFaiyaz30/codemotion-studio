import { runAnalyzer } from "@/lib/scanner/analyzer";
import { saveAnalysisResult } from "@/lib/storage/analysis-store";
import { toBrowserSafeAnalysis } from "@/lib/storage/browser-analysis-store";
import { encodeSse } from "@/lib/stream/sse";
import type { AnalysisMode } from "@/lib/types/analysis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const modes: AnalysisMode[] = ["fast", "balanced", "deep", "huge"];

function isAnalysisMode(value: unknown): value is AnalysisMode {
  return typeof value === "string" && modes.includes(value as AnalysisMode);
}

export async function POST(request: Request) {
  const rawPayload = await request.json().catch(() => ({}));
  const payload =
    typeof rawPayload === "object" && rawPayload !== null
      ? (rawPayload as Record<string, unknown>)
      : {};

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const iterator = runAnalyzer({
          repoUrl: typeof payload.repoUrl === "string" ? payload.repoUrl : undefined,
          mode: isAnalysisMode(payload.mode) ? payload.mode : "balanced",
          manualFiles: typeof payload.manualFiles === "string" ? payload.manualFiles : undefined
        });
        let next = await iterator.next();

        while (!next.done) {
          controller.enqueue(encoder.encode(encodeSse(next.value)));
          next = await iterator.next();
        }

        const result = next.value;
        saveAnalysisResult(result);
        controller.enqueue(
          encoder.encode(
            encodeSse({
              type: "final",
              stage: "done",
              message: "Analysis saved. Visualization dashboard is ready.",
              progress: 100,
              details: {
                analysisId: result.id,
                repoName: result.repoName,
                filesSelected: result.stats.filesSelected,
                astParsedFiles: result.stats.astParsedFiles,
                analysis: toBrowserSafeAnalysis(result)
              }
            })
          )
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeSse({
              type: "error",
              stage: "done",
              message: error instanceof Error ? error.message : "Analysis failed.",
              progress: 100
            })
          )
        );
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
