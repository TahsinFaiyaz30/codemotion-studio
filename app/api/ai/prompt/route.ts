import { NextResponse } from "next/server";
import { generateAiText, getAiStatus } from "@/lib/ai/provider";
import { promptsFromAnalysis } from "@/lib/scanner/prompt-forge";
import type { AnalysisResult } from "@/lib/types/analysis";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    analysis?: AnalysisResult;
  };

  if (!payload.analysis) {
    return NextResponse.json({ ok: false, error: "Analysis payload is required." }, { status: 400 });
  }

  const prompts = promptsFromAnalysis(payload.analysis);
  const status = getAiStatus({ providerChoice: payload.analysis.aiProviderChoice, task: "prompt" });
  const aiText = status.configured
    ? await generateAiText({
        providerChoice: payload.analysis.aiProviderChoice,
        task: "prompt",
        system: "You create concise developer prompts from codebase analysis facts.",
        prompt: JSON.stringify({
          repoName: payload.analysis.repoName,
          stack: payload.analysis.stack,
          clusters: payload.analysis.clusters,
          flows: payload.analysis.flows.map((flow) => flow.name)
        })
      }).catch((error) => (error instanceof Error ? error.message : null))
    : null;

  return NextResponse.json({
    ok: true,
    provider: status.provider,
    prompts,
    aiText
  });
}
