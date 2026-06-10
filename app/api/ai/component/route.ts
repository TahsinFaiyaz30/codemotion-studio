import { NextResponse } from "next/server";
import { generateAiText, getAiStatus, normalizeAiProviderChoice } from "@/lib/ai/provider";
import { forgeComponentSpec } from "@/lib/scanner/component-forge";
import type { AiProviderChoice, DesignDNA } from "@/lib/types/analysis";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    repoName?: string;
    designDNA?: DesignDNA;
    primaryFlowName?: string;
    aiProvider?: AiProviderChoice;
  };

  if (!payload.repoName || !payload.designDNA) {
    return NextResponse.json(
      { ok: false, error: "repoName and designDNA are required." },
      { status: 400 }
    );
  }

  const componentSpec = forgeComponentSpec({
    repoName: payload.repoName,
    designDNA: payload.designDNA,
    primaryFlowName: payload.primaryFlowName ?? "application overview"
  });
  const providerChoice = normalizeAiProviderChoice(payload.aiProvider);
  const status = getAiStatus({ providerChoice, task: "component" });
  const aiNotes = status.configured
    ? await generateAiText({
        providerChoice,
        task: "component",
        system: "You review safe ComponentSpec JSON. Return short implementation notes only.",
        prompt: JSON.stringify(componentSpec)
      }).catch((error) => (error instanceof Error ? error.message : null))
    : null;

  return NextResponse.json({
    ok: true,
    provider: status.provider,
    componentSpec,
    aiNotes
  });
}
