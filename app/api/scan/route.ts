import { NextResponse } from "next/server";
import { runAnalyzer } from "@/lib/scanner/analyzer";
import type { AnalysisMode } from "@/lib/types/analysis";

const modes: AnalysisMode[] = ["fast", "balanced", "deep", "huge"];

function isAnalysisMode(value: unknown): value is AnalysisMode {
  return typeof value === "string" && modes.includes(value as AnalysisMode);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    repoUrl?: string;
    manualFiles?: string;
    mode?: unknown;
  };
  const iterator = runAnalyzer({
    repoUrl: payload.repoUrl,
    manualFiles: payload.manualFiles,
    mode: isAnalysisMode(payload.mode) ? payload.mode : "balanced"
  });
  let next = await iterator.next();

  while (!next.done) {
    next = await iterator.next();
  }

  return NextResponse.json({
    ok: true,
    analysis: next.value
  });
}
