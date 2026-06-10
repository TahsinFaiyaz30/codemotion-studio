import { generateAiText, getAiStatus } from "@/lib/ai/provider";
import { buildStoryPrompt, parseStoryJson } from "@/lib/ai/storyPrompts";
import type {
  AiProviderChoice,
  AppUnderstanding,
  CodebaseStory,
  CodebaseStoryScene,
  DesignDNA,
  FolderAgentReport,
  RuntimeFlow,
  StoryAnimationType
} from "@/lib/types/analysis";

const animationTypes: StoryAnimationType[] = [
  "hero-intro",
  "problem-solution",
  "ui-click",
  "api-tunnel",
  "database-pulse",
  "stack-reveal",
  "ending"
];

function titleForRepo(repoName: string) {
  return repoName.includes("/")
    ? repoName.split("/").at(-1)?.replace(/[-_]/g, " ") ?? repoName
    : repoName.replace(/[-_]/g, " ");
}

function inferUsers(runtimeFlows: RuntimeFlow[]) {
  const users = Array.from(
    new Set(runtimeFlows.map((flow) => flow.actor).filter((actor) => actor !== "unknown"))
  );

  return users.length ? users.map((actor) => `${actor.charAt(0).toUpperCase()}${actor.slice(1)}s`) : ["People using the app"];
}

function productAreasFromUnderstanding(appUnderstanding?: AppUnderstanding) {
  const evidenceLine =
    appUnderstanding?.supportingEvidence.find((item) => item.toLowerCase().startsWith("product areas:")) ??
    appUnderstanding?.supportingEvidence.find((item) => item.toLowerCase().startsWith("detected product terms:"));

  return evidenceLine?.replace(/^[^:]+:\s*/, "") ?? appUnderstanding?.appType ?? "the important product work";
}

function heroFromAudience(appUnderstanding?: AppUnderstanding) {
  const audience = appUnderstanding?.audience?.[0] ?? "person";

  if (audience.includes("creator")) return "creator team member";
  if (audience.endsWith("s")) return audience.slice(0, -1);
  return audience;
}

function sceneFromRuntimeFlow(
  flow: RuntimeFlow,
  index: number,
  appUnderstanding: AppUnderstanding | undefined
): CodebaseStoryScene {
  const relatedFiles = Array.from(new Set(flow.steps.flatMap((step) => step.filePaths))).slice(0, 8);
  const displayName = appUnderstanding?.appName ?? "The app";
  const hero = heroFromAudience(appUnderstanding);
  const productAreas = productAreasFromUnderstanding(appUnderstanding);

  return {
    id: `scene-${flow.id}`,
    sceneNumber: index + 3,
    title: "A real action moves forward",
    narration: `The ${hero} chooses one next move, and ${displayName} turns that choice into organized progress instead of scattered follow-up.`,
    whatUserSees: `A focused workspace for ${flow.userGoal}.`,
    whatUserDoes: `The ${hero} picks the work that needs attention and moves it forward.`,
    whatAppDoesBehindScenes: `${displayName} keeps ${productAreas} connected so the visible action still has context behind it.`,
    relatedRuntimeFlowId: flow.id,
    relatedFiles,
    animationType: animationTypes[(index + 2) % animationTypes.length],
    componentsNeeded: ["browser-window", "data-packet", "timeline-step"],
    durationHintSeconds: Math.min(12, Math.max(6, flow.steps.length))
  };
}

function localStory(input: {
  repoName: string;
  summary: string;
  runtimeFlows: RuntimeFlow[];
  designDNA: DesignDNA;
  appUnderstanding?: AppUnderstanding;
  folderReports?: FolderAgentReport[];
}): CodebaseStory {
  const displayName = input.appUnderstanding?.appName ?? titleForRepo(input.repoName);
  const mainFlow = input.runtimeFlows[0];
  const problem =
    input.appUnderstanding?.realWorldProblem ??
    `A person needs to ${mainFlow?.userGoal ?? "finish an important task"}, but the work has hidden steps.`;
  const solution =
    input.appUnderstanding?.solution ??
    `${displayName} turns that confusing process into one guided application experience.`;
  const outcome =
    input.appUnderstanding?.primaryOutcome ??
    mainFlow?.endsAt ??
    "the person sees that the task worked";
  const hero = heroFromAudience(input.appUnderstanding);
  const productAreas = productAreasFromUnderstanding(input.appUnderstanding);
  const motifs =
    input.appUnderstanding?.supportingEvidence
      ?.flatMap((item) => item.split(/[:,]/).slice(0, 1))
      .slice(0, 4) ?? [];
  const scenes: CodebaseStoryScene[] = [
    {
      id: "scene-opening",
      sceneNumber: 1,
      title: "The problem before the app",
      narration: `Imagine a ${hero.toLowerCase()} stuck with this problem: ${problem}`,
      whatUserSees: "A real-world task with too many unclear steps.",
      whatUserDoes: "The person looks for a simpler way to get the job done.",
      whatAppDoesBehindScenes: `${displayName} is about to turn that messy situation into a guided product flow.`,
      relatedRuntimeFlowId: mainFlow?.id ?? "runtime-overview",
      relatedFiles: [],
      animationType: "problem-solution",
      componentsNeeded: ["user-avatar", "feature-spotlight"],
      durationHintSeconds: 7
    },
    {
      id: "scene-product-arrives",
      sceneNumber: 2,
      title: `${displayName} becomes the helper`,
      narration: solution,
      whatUserSees: `The app presents a ${input.appUnderstanding?.appType ?? "web app"} experience with a clear next action.`,
      whatUserDoes: mainFlow?.trigger ?? "The person starts the main app journey.",
      whatAppDoesBehindScenes:
        `${displayName} organizes the product context so the person can focus on the decision or task instead of the messy process around it.`,
      relatedRuntimeFlowId: mainFlow?.id ?? "runtime-overview",
      relatedFiles: [],
      animationType: "hero-intro",
      componentsNeeded: ["browser-window", "data-packet", "flow-map"],
      durationHintSeconds: 8
    },
    ...(mainFlow ? [sceneFromRuntimeFlow(mainFlow, 0, input.appUnderstanding)] : []),
    {
      id: "scene-connected-work",
      sceneNumber: mainFlow ? 4 : 3,
      title: "The scattered work stays connected",
      narration: `${displayName} keeps the important product areas connected: ${productAreas}.`,
      whatUserSees: "The workspace updates around the action instead of making the person chase separate tools.",
      whatUserDoes: `The ${hero.toLowerCase()} can review what changed and decide what deserves attention next.`,
      whatAppDoesBehindScenes:
        `${displayName} keeps the product context, saved state, and follow-up signals tied to the same journey.`,
      relatedRuntimeFlowId: mainFlow?.id ?? "runtime-overview",
      relatedFiles: Array.from(new Set(mainFlow?.steps.flatMap((step) => step.filePaths) ?? [])).slice(0, 8),
      animationType: "database-pulse",
      componentsNeeded: ["browser-window", "data-packet", "flow-map"],
      durationHintSeconds: 8
    }
  ];

  scenes.push({
    id: "scene-ending",
    sceneNumber: scenes.length + 1,
    title: "The useful outcome",
    narration: `By the end, ${outcome}. The person understands what changed, what matters next, and why the app helped.`,
    whatUserSees: "A finished action, confirmation, dashboard update, or useful screen.",
    whatUserDoes: "The person trusts the app because it made the hard part feel simple.",
    whatAppDoesBehindScenes:
      `${displayName} keeps the important product state connected to the visible outcome.`,
    relatedRuntimeFlowId: mainFlow?.id ?? "runtime-overview",
    relatedFiles: [],
    animationType: "ending",
    componentsNeeded: ["stack-badge", "flow-map"],
    durationHintSeconds: 6
  });

  return {
    id: `story-${input.repoName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
    title: `${displayName}: The Human Story`,
    subtitle: "An app-level story generated from runtime flow, folder agents, and code evidence.",
    normalPersonSummary: input.appUnderstanding?.mainUserJourney ?? solution,
    whoUsesThis: input.appUnderstanding?.audience?.length
      ? input.appUnderstanding.audience
      : inferUsers(input.runtimeFlows),
    whyItExists: solution,
    mainProblemSolved: problem,
    storyArc: {
      opening: `A ${hero.toLowerCase()} faces a concrete task in the real world.`,
      problem,
      journey: `${displayName} guides the action through product context, decisions, saved state, and visible outcome.`,
      resolution: `The outcome is clear: ${outcome}.`
    },
    scenes,
    ending: `${displayName} is not just files. It is a product that helps someone move from problem to result.`,
    developerTakeaway:
      "Folder agents gather evidence, Actual App Flow shows runtime movement, and Story Mode explains the product meaning.",
    nonTechnicalTakeaway: `${displayName} helps ${hero.toLowerCase()}s solve a real problem through a guided app experience.`,
    world: {
      setting: input.appUnderstanding?.appType ?? "a web app experience",
      hero,
      tension: problem,
      productRole: solution,
      emotionalPayoff: `The person gets ${outcome}.`,
      visualMotifs: motifs.length ? motifs : ["screen", "data path", "result"]
    }
  };
}

export async function generateCodebaseStory(input: {
  repoName: string;
  summary: string;
  runtimeFlows: RuntimeFlow[];
  designDNA: DesignDNA;
  appUnderstanding?: AppUnderstanding;
  folderReports?: FolderAgentReport[];
  providerChoice?: AiProviderChoice;
}) {
  const aiStatus = getAiStatus({ providerChoice: input.providerChoice, task: "story" });

  if (aiStatus.configured) {
    try {
      const aiText = await generateAiText({
        providerChoice: input.providerChoice,
        task: "story",
        system:
          "You generate structured JSON only. The JSON must match CodebaseStory and must be a literal human story based only on provided analysis facts.",
        prompt: buildStoryPrompt(input),
        temperature: 0.35
      });
      const parsed = aiText ? parseStoryJson(aiText) : null;

      if (parsed?.scenes?.length) {
        return parsed;
      }
    } catch {
      // Local story generation below keeps the analysis path resilient on free API limits.
    }
  }

  return localStory(input);
}
