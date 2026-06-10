import type {
  AppUnderstanding,
  CodebaseStory,
  DesignDNA,
  FolderAgentReport,
  RuntimeFlow
} from "@/lib/types/analysis";

export function buildStoryPrompt(input: {
  repoName: string;
  summary: string;
  runtimeFlows: RuntimeFlow[];
  designDNA: DesignDNA;
  appUnderstanding?: AppUnderstanding;
  folderReports?: FolderAgentReport[];
}) {
  return JSON.stringify({
    task: "Generate a literal normal-person animated story. Return JSON that matches CodebaseStory.",
    constraints: [
      "Base the story only on provided analysis.",
      "Do not invent unrelated product features.",
      "Do not make the plot about files or functions.",
      "The plot must be about a real person facing a real-world problem, using the app, and reaching a useful outcome.",
      "Explain what the app is, why it exists, who uses it, and what happens behind the scenes.",
      "Every scene must be suitable for animation with characters, screens, data movement, and payoff.",
      "Include world.setting, world.hero, world.tension, world.productRole, world.emotionalPayoff, and world.visualMotifs."
    ],
    repoName: input.repoName,
    summary: input.summary,
    appUnderstanding: input.appUnderstanding,
    folderReports: input.folderReports?.map((report) => ({
      folder: report.folder,
      appPurpose: report.appPurpose,
      userFacingRole: report.userFacingRole,
      realWorldSignals: report.realWorldSignals,
      confidence: report.confidence
    })),
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
