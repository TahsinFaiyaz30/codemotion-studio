import type { AppUnderstanding, CodebaseStory, RuntimeFlow } from "@/lib/types/analysis";

const technicalLeakPattern =
  /\b(auth|oauth|controller|controllers|route|routes|middleware|service|services|provider|providers|util|helper|backend work|graph nodes|selected files|grouped under|no clear product purpose)\b/i;

const weakProductPhrases = [
  "no clear product purpose",
  "backend work",
  "visible actions",
  "clear result",
  "guided web experience",
  "guided application experience",
  "files grouped under",
  "graph nodes",
  "selected files"
];

function joinFlowText(flow: RuntimeFlow) {
  return [
    flow.name,
    flow.plainEnglishName,
    flow.purpose,
    flow.userGoal,
    flow.beginnerExplanation,
    flow.businessMeaning,
    ...flow.steps.flatMap((step) => [step.title, step.plainEnglish, step.technical]),
    ...(flow.visualSpec?.nodes.flatMap((node) => [node.label, node.role]) ?? []),
    ...(flow.visualSpec?.evidence ?? [])
  ].join(" ");
}

export function hasTechnicalRuntimeLeak(flow: RuntimeFlow) {
  return technicalLeakPattern.test(joinFlowText(flow));
}

export function hasWeakAppUnderstanding(appUnderstanding?: AppUnderstanding) {
  if (!appUnderstanding) return true;

  const text = [
    appUnderstanding.appType,
    appUnderstanding.realWorldProblem,
    appUnderstanding.solution,
    appUnderstanding.mainUserJourney,
    ...appUnderstanding.supportingEvidence
  ].join(" ");

  const lower = text.toLowerCase();

  return weakProductPhrases.some((phrase) => lower.includes(phrase)) || technicalLeakPattern.test(text);
}

export function hasLegacyStory(story?: CodebaseStory) {
  if (!story?.scenes?.length || !story.world) return true;

  const text = [
    story.title,
    story.normalPersonSummary,
    story.whyItExists,
    story.mainProblemSolved,
    ...story.scenes.flatMap((scene) => [
      scene.title,
      scene.narration,
      scene.whatUserSees,
      scene.whatUserDoes,
      scene.whatAppDoesBehindScenes
    ])
  ].join(" ");

  const lower = text.toLowerCase();

  return technicalLeakPattern.test(text) || weakProductPhrases.some((phrase) => lower.includes(phrase));
}
