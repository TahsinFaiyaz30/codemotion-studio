import type { CodebaseStory, DesignDNA, RuntimeFlow } from "@/lib/types/analysis";

export function buildStoryPrompt(input: {
  repoName: string;
  summary: string;
  runtimeFlows: RuntimeFlow[];
  designDNA: DesignDNA;
}) {
  return JSON.stringify({
    task: "Generate a normal-person codebase story. Return JSON that matches CodebaseStory.",
    constraints: [
      "Base the story only on provided analysis.",
      "Do not invent unrelated product features.",
      "Keep the tone clear, cinematic, and practical.",
      "Explain what the app is, why it exists, who uses it, and what happens behind the scenes."
    ],
    repoName: input.repoName,
    summary: input.summary,
    runtimeFlows: input.runtimeFlows.map((flow) => ({
      id: flow.id,
      name: flow.name,
      plainEnglishName: flow.plainEnglishName,
      actor: flow.actor,
      userGoal: flow.userGoal,
      steps: flow.steps.map((step) => ({
        layer: step.layer,
        title: step.title,
        plainEnglish: step.plainEnglish,
        filePaths: step.filePaths
      }))
    })),
    designDNA: input.designDNA
  });
}

export function parseStoryJson(value: string): CodebaseStory | null {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as CodebaseStory;
  } catch {
    return null;
  }
}

