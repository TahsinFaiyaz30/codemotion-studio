import { NextResponse } from "next/server";
import {
  isAnalysisResult,
  toBrowserSafeAnalysis
} from "@/lib/storage/browser-analysis-store";
import { saveAnalysisResult } from "@/lib/storage/analysis-store";
import { ensureAnalysisLayers } from "@/lib/story/ensureAnalysisLayers";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { analysis?: unknown } | null;

  if (!isAnalysisResult(payload?.analysis)) {
    return NextResponse.json({ ok: false, error: "A valid analysis result is required." }, { status: 400 });
  }

  const upgradedAnalysis = await ensureAnalysisLayers(payload.analysis);
  saveAnalysisResult(upgradedAnalysis);

  return NextResponse.json({
    ok: true,
    analysis: toBrowserSafeAnalysis(upgradedAnalysis)
  });
}
