import { NextResponse } from "next/server";
import { buildFeatureClusters } from "@/lib/scanner/cluster-builder";
import type { AnalysisResult } from "@/lib/types/analysis";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    analysis?: AnalysisResult;
  };

  if (!payload.analysis) {
    return NextResponse.json({ ok: false, error: "Analysis payload is required." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    clusters: buildFeatureClusters(payload.analysis.files, payload.analysis.nodes)
  });
}
