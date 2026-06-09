import { NextResponse } from "next/server";
import { getAnalysisResult, saveAnalysisResult } from "@/lib/storage/analysis-store";
import { ensureAnalysisLayers } from "@/lib/story/ensureAnalysisLayers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params;
  const analysis = getAnalysisResult(analysisId);

  if (!analysis) {
    return NextResponse.json({ ok: false, error: "Analysis result not found." }, { status: 404 });
  }

  const upgradedAnalysis = await ensureAnalysisLayers(analysis);
  saveAnalysisResult(upgradedAnalysis);

  return NextResponse.json({
    ok: true,
    analysis: upgradedAnalysis
  });
}
