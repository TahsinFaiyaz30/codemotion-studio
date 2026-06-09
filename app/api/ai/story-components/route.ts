import { NextResponse } from "next/server";
import { planStoryComponents } from "@/lib/story/storyComponentPlanner";
import type { CodebaseStory, DesignDNA, RuntimeFlow } from "@/lib/types/analysis";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    story?: CodebaseStory;
    designDNA?: DesignDNA;
    runtimeFlows?: RuntimeFlow[];
  };

  if (!payload.story || !payload.designDNA || !payload.runtimeFlows) {
    return NextResponse.json(
      { ok: false, error: "story, designDNA, and runtimeFlows are required." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    storyComponents: planStoryComponents({
      story: payload.story,
      designDNA: payload.designDNA,
      runtimeFlows: payload.runtimeFlows
    })
  });
}

