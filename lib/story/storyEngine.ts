import { generateAiText, getAiStatus } from "@/lib/ai/provider";
import { buildStoryPrompt, parseStoryJson } from "@/lib/ai/storyPrompts";
import type {
  CodebaseStory,
  CodebaseStoryScene,
  DesignDNA,
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

function sceneFromRuntimeFlow(flow: RuntimeFlow, index: number): CodebaseStoryScene {
  const firstStep = flow.steps[0];
  const technicalSteps = flow.steps.filter((step) => step.layer !== "user");
  const relatedFiles = Array.from(new Set(flow.steps.flatMap((step) => step.filePaths))).slice(0, 8);

  return {
    id: `scene-${flow.id}`,
    sceneNumber: index + 2,
    title: flow.plainEnglishName,
    narration: flow.beginnerExplanation,
    whatUserSees: flow.startsAt,
    whatUserDoes: firstStep?.plainEnglish ?? flow.trigger,
    whatAppDoesBehindScenes:
      technicalSteps
        .slice(0, 4)
        .map((step) => `${step.title}: ${step.plainEnglish}`)
        .join(" ") || "The app moves through its screen, backend, and data layers.",
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
}): CodebaseStory {
  const displayName = titleForRepo(input.repoName);
  const mainFlow = input.runtimeFlows[0];
  const scenes: CodebaseStoryScene[] = [
    {
      id: "scene-opening",
      sceneNumber: 1,
      title: `Meet ${displayName}`,
      narration: `${displayName} is an application whose code shows ${mainFlow?.plainEnglishName.toLowerCase() ?? "a main user journey"}.`,
      whatUserSees: "A website or app screen that starts the main task.",
      whatUserDoes: mainFlow?.trigger ?? "The person opens the app.",
      whatAppDoesBehindScenes: "CodeMotion connects the visible screens to the files, APIs, and data layers that make them work.",
      relatedRuntimeFlowId: mainFlow?.id ?? "runtime-overview",
      relatedFiles: [],
      animationType: "hero-intro",
      componentsNeeded: ["browser-window", "feature-spotlight"],
      durationHintSeconds: 7
    },
    ...input.runtimeFlows.slice(0, 5).map(sceneFromRuntimeFlow)
  ];

  scenes.push({
    id: "scene-ending",
    sceneNumber: scenes.length + 1,
    title: "What the code is really doing",
    narration: `${displayName} combines ${input.designDNA.visualTone} with ${input.runtimeFlows.length} detected app flow${input.runtimeFlows.length === 1 ? "" : "s"}.`,
    whatUserSees: "A finished action, confirmation, or updated screen.",
    whatUserDoes: "The person understands the app without reading every file.",
    whatAppDoesBehindScenes: "The technical graph, runtime flow, and story layer all point back to the same analyzed code.",
    relatedRuntimeFlowId: mainFlow?.id ?? "runtime-overview",
    relatedFiles: [],
    animationType: "ending",
    componentsNeeded: ["stack-badge", "flow-map"],
    durationHintSeconds: 6
  });

  return {
    id: `story-${input.repoName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
    title: `${displayName}: The App Story`,
    subtitle: "A normal-person explanation generated from real code analysis.",
    normalPersonSummary:
      mainFlow?.beginnerExplanation ??
      `${displayName} is explained through its visible screens, behind-the-scenes code, and final user result.`,
    whoUsesThis: inferUsers(input.runtimeFlows),
    whyItExists:
      mainFlow?.businessMeaning ??
      "It exists to help people complete a task through a web interface backed by code and data.",
    mainProblemSolved: mainFlow?.userGoal ?? "help a person complete the main application task",
    storyArc: {
      opening: `A person arrives at ${displayName}.`,
      problem: `They need to ${mainFlow?.userGoal ?? "finish a task"} without understanding the code.`,
      journey: "The app moves their action through UI, backend logic, data, and a response.",
      resolution: "The screen updates and the person understands what the app accomplished."
    },
    scenes,
    ending: "Story Mode turns technical structure into a product story people can follow.",
    developerTakeaway: "Graph Mode shows file connections; Actual App Flow shows runtime journeys; Story Mode explains the product meaning.",
    nonTechnicalTakeaway: `${displayName} can be understood as a set of human actions, app reactions, and useful outcomes.`
  };
}

export async function generateCodebaseStory(input: {
  repoName: string;
  summary: string;
  runtimeFlows: RuntimeFlow[];
  designDNA: DesignDNA;
}) {
  const aiStatus = getAiStatus();

  if (aiStatus.configured) {
    try {
      const aiText = await generateAiText({
        system:
          "You generate structured JSON only. The JSON must match CodebaseStory and must be based only on provided analysis facts.",
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

