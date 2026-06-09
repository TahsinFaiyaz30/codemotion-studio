import { NextResponse } from "next/server";
import { getAnalysisResult } from "@/lib/storage/analysis-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params;
  const analysis = getAnalysisResult(analysisId);

  if (!analysis) {
    return NextResponse.json({ ok: false, error: "Analysis result not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    analysis
  });
}

