import { NextResponse } from "next/server";
import { generateCodebaseStory } from "@/lib/story/storyEngine";
import type { AnalysisResult } from "@/lib/types/analysis";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    analysis?: AnalysisResult;
  };

  if (!payload.analysis) {
    return NextResponse.json({ ok: false, error: "Analysis payload is required." }, { status: 400 });
  }

  const story = await generateCodebaseStory({
    repoName: payload.analysis.repoName,
    summary: payload.analysis.summary,
    runtimeFlows: payload.analysis.runtimeFlows,
    designDNA: payload.analysis.designDNA,
    appUnderstanding: payload.analysis.appUnderstanding,
    folderReports: payload.analysis.folderReports,
    providerChoice: payload.analysis.aiProviderChoice
  });

  return NextResponse.json({
    ok: true,
    story
  });
}
