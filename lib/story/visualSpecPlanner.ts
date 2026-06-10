import { generateAiText } from "@/lib/ai/provider";
import type {
  AiProviderChoice,
  AppUnderstanding,
  CodebaseStory,
  CodebaseStoryScene,
  FlowVisualSpec,
  RuntimeFlow,
  RuntimeFlowStep,
  StoryMotionType,
  VisualActorKind,
  VisualActorSpec,
  VisualMotionSpec,
  VisualSceneSpec
} from "@/lib/types/analysis";

const colorPalette = ["#0f9f8e", "#df6f31", "#5b7cfa", "#18a46f", "#c98a05", "#8b5cf6"];

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "item";
}

function kindForLayer(layer: RuntimeFlowStep["layer"]): VisualActorKind {
  if (layer === "user") return "person";
  if (layer === "screen" || layer === "component" || layer === "state" || layer === "ui-update") {
    return "screen";
  }
  if (layer === "api") return "api";
  if (layer === "database") return "database";
  if (layer === "response") return "result";
  return "service";
}

function actorFromStep(step: RuntimeFlowStep, index: number): VisualActorSpec {
  return {
    id: `actor-${sanitizeId(step.layer)}-${index}`,
    label: step.title,
    kind: kindForLayer(step.layer),
    role: step.plainEnglish,
    color: colorPalette[index % colorPalette.length],
    iconHint: step.visualHint
  };
}

function motionBetweenActors(actors: VisualActorSpec[], index: number): VisualMotionSpec {
  const from = actors[index];
  const to = actors[index + 1] ?? actors[0];

  return {
    actorId: from.id,
    from: from.id,
    to: to.id,
    label: `${from.label} to ${to.label}`,
    motion: index % 2 === 0 ? "packet-travel" : "slide",
    durationSeconds: 1.6
  };
}

function parseJson<T>(value: string): T | null {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function normalizeMotion(value: unknown): StoryMotionType {
  if (
    value === "fade" ||
    value === "slide" ||
    value === "scale" ||
    value === "packet-travel" ||
    value === "pulse" ||
    value === "orbit" ||
    value === "morph" ||
    value === "reveal" ||
    value === "typewriter"
  ) {
    return value;
  }

  return "packet-travel";
}

function normalizeActor(value: Partial<VisualActorSpec>, index: number): VisualActorSpec {
  const rawLabel = typeof value.label === "string" ? value.label.slice(0, 64) : `Actor ${index + 1}`;
  const technicalLabel = /\b(controller|route|routes|middleware|service|provider|util|helper|component)\b/i.test(rawLabel);
  const safeLabel = technicalLabel
    ? index === 0
      ? "Person starts the journey"
      : index === 1
        ? "App presents the workspace"
        : "Product step moves forward"
    : rawLabel;

  return {
    id: typeof value.id === "string" ? sanitizeId(value.id) : `actor-${index}`,
    label: safeLabel,
    kind:
      value.kind === "person" ||
      value.kind === "app" ||
      value.kind === "screen" ||
      value.kind === "api" ||
      value.kind === "database" ||
      value.kind === "service" ||
      value.kind === "result"
        ? value.kind
        : "service",
    role: typeof value.role === "string" && !/\bbackend work|route|controller|middleware\b/i.test(value.role)
      ? value.role.slice(0, 220)
      : "This product stage helps the person move from problem to useful outcome.",
    color:
      typeof value.color === "string" && /^#[0-9a-f]{6}$/i.test(value.color)
        ? value.color
        : colorPalette[index % colorPalette.length],
    iconHint: typeof value.iconHint === "string" ? value.iconHint.slice(0, 32) : "node"
  };
}

function normalizeMotionSpec(
  value: Partial<VisualMotionSpec>,
  actors: VisualActorSpec[],
  index: number
): VisualMotionSpec {
  const fallback = motionBetweenActors(actors, index % Math.max(1, actors.length - 1));
  const ids = new Set(actors.map((actor) => actor.id));

  return {
    actorId: typeof value.actorId === "string" && ids.has(value.actorId) ? value.actorId : fallback.actorId,
    from: typeof value.from === "string" && ids.has(value.from) ? value.from : fallback.from,
    to: typeof value.to === "string" && ids.has(value.to) ? value.to : fallback.to,
    label: typeof value.label === "string" ? value.label.slice(0, 80) : fallback.label,
    motion: normalizeMotion(value.motion),
    durationSeconds:
      typeof value.durationSeconds === "number"
        ? Math.max(0.4, Math.min(8, value.durationSeconds))
        : fallback.durationSeconds
  };
}

function localFlowVisualSpec(flow: RuntimeFlow): FlowVisualSpec {
  const actors = flow.steps.map(actorFromStep);

  return {
    id: `flow-visual-${sanitizeId(flow.id)}`,
    runtimeFlowId: flow.id,
    title: flow.plainEnglishName,
    nodes: actors,
    motions: actors.slice(0, -1).map((_, index) => motionBetweenActors(actors, index)),
    evidence: Array.from(new Set(flow.steps.flatMap((step) => step.filePaths))).slice(0, 8)
  };
}

function localSceneVisualSpec({
  story,
  scene,
  runtimeFlows,
  appUnderstanding
}: {
  story: CodebaseStory;
  scene: CodebaseStoryScene;
  runtimeFlows: RuntimeFlow[];
  appUnderstanding?: AppUnderstanding;
}): VisualSceneSpec {
  const relatedFlow = runtimeFlows.find((flow) => flow.id === scene.relatedRuntimeFlowId) ?? runtimeFlows[0];
  const baseActors: VisualActorSpec[] = [
    {
      id: "hero",
      label: story.world?.hero ?? appUnderstanding?.audience?.[0] ?? "User",
      kind: "person",
      role: scene.whatUserDoes,
      color: "#df6f31",
      iconHint: "user"
    },
    {
      id: "app",
      label: appUnderstanding?.appName ?? story.title,
      kind: "app",
      role: scene.whatAppDoesBehindScenes,
      color: "#0f9f8e",
      iconHint: "app"
    },
    {
      id: "result",
      label: appUnderstanding?.primaryOutcome ?? "Useful result",
      kind: "result",
      role: story.world?.emotionalPayoff ?? story.ending,
      color: "#18a46f",
      iconHint: "result"
    }
  ];
  const flowActors = relatedFlow?.steps.slice(1, 4).map(actorFromStep) ?? [];
  const actors = [...baseActors, ...flowActors].slice(0, 7);

  return {
    id: `visual-${sanitizeId(scene.id)}`,
    title: scene.title,
    purpose: scene.narration,
    camera: scene.animationType === "ending" ? "payoff" : scene.animationType === "hero-intro" ? "wide" : "journey",
    setting: story.world?.setting ?? appUnderstanding?.appType ?? "web app",
    actors,
    motions: actors.slice(0, -1).map((_, index) => motionBetweenActors(actors, index)),
    narrationBeats: [scene.narration, scene.whatUserDoes, scene.whatAppDoesBehindScenes],
    evidence: Array.from(
      new Set([...(scene.relatedFiles ?? []), ...(relatedFlow?.steps.flatMap((step) => step.filePaths) ?? [])])
    ).slice(0, 8)
  };
}

function normalizeFlowSpec(value: Partial<FlowVisualSpec>, fallback: FlowVisualSpec): FlowVisualSpec {
  const actors = Array.isArray(value.nodes)
    ? value.nodes.slice(0, 10).map((actor, index) => normalizeActor(actor, index))
    : fallback.nodes;

  return {
    id: typeof value.id === "string" ? sanitizeId(value.id) : fallback.id,
    runtimeFlowId:
      typeof value.runtimeFlowId === "string" ? sanitizeId(value.runtimeFlowId) : fallback.runtimeFlowId,
    title: typeof value.title === "string" ? value.title.slice(0, 80) : fallback.title,
    nodes: actors,
    motions: Array.isArray(value.motions)
      ? value.motions.slice(0, 12).map((motion, index) => normalizeMotionSpec(motion, actors, index))
      : fallback.motions,
    evidence: Array.isArray(value.evidence)
      ? value.evidence.filter((item): item is string => typeof item === "string").slice(0, 8)
      : fallback.evidence
  };
}

function normalizeSceneSpec(value: Partial<VisualSceneSpec>, fallback: VisualSceneSpec): VisualSceneSpec {
  const actors = Array.isArray(value.actors)
    ? value.actors.slice(0, 8).map((actor, index) => normalizeActor(actor, index))
    : fallback.actors;

  return {
    id: typeof value.id === "string" ? sanitizeId(value.id) : fallback.id,
    title: typeof value.title === "string" ? value.title.slice(0, 80) : fallback.title,
    purpose: typeof value.purpose === "string" ? value.purpose.slice(0, 320) : fallback.purpose,
    camera:
      value.camera === "wide" ||
      value.camera === "focused" ||
      value.camera === "journey" ||
      value.camera === "payoff"
        ? value.camera
        : fallback.camera,
    setting: typeof value.setting === "string" ? value.setting.slice(0, 80) : fallback.setting,
    actors,
    motions: Array.isArray(value.motions)
      ? value.motions.slice(0, 12).map((motion, index) => normalizeMotionSpec(motion, actors, index))
      : fallback.motions,
    narrationBeats: Array.isArray(value.narrationBeats)
      ? value.narrationBeats.filter((item): item is string => typeof item === "string").slice(0, 5)
      : fallback.narrationBeats,
    evidence: Array.isArray(value.evidence)
      ? value.evidence.filter((item): item is string => typeof item === "string").slice(0, 8)
      : fallback.evidence
  };
}

export async function enrichRuntimeFlowsWithVisualSpecs({
  runtimeFlows,
  appUnderstanding,
  providerChoice
}: {
  runtimeFlows: RuntimeFlow[];
  appUnderstanding?: AppUnderstanding;
  providerChoice?: AiProviderChoice;
}) {
  const enriched = await Promise.all(
    runtimeFlows.map(async (flow, index) => {
      const fallback = localFlowVisualSpec(flow);

      try {
        const aiText = await generateAiText({
          providerChoice,
          task: "component",
          taskIndex: index,
          system:
            "Return JSON only. Create a safe FlowVisualSpec for a controlled animated renderer. Do not output code or JSX. Actor labels must be product/user stages, never controllers, routes, middleware, services, files, or functions.",
          prompt: JSON.stringify({
            appUnderstanding,
            runtimeFlow: flow,
            requiredShape: {
              id: "string",
              runtimeFlowId: flow.id,
              title: "string",
              nodes: "VisualActorSpec[]",
              motions: "VisualMotionSpec[]",
              evidence: "string[]"
            }
          }),
          temperature: 0.2
        });
        const parsed = aiText ? parseJson<Partial<FlowVisualSpec>>(aiText) : null;

        return {
          ...flow,
          visualSpec: parsed ? normalizeFlowSpec(parsed, fallback) : fallback
        };
      } catch {
        return {
          ...flow,
          visualSpec: fallback
        };
      }
    })
  );

  return enriched;
}

export async function enrichStoryWithVisualSpecs({
  story,
  runtimeFlows,
  appUnderstanding,
  providerChoice
}: {
  story: CodebaseStory;
  runtimeFlows: RuntimeFlow[];
  appUnderstanding?: AppUnderstanding;
  providerChoice?: AiProviderChoice;
}) {
  const scenes = await Promise.all(
    story.scenes.map(async (scene, index) => {
      const fallback = localSceneVisualSpec({ story, scene, runtimeFlows, appUnderstanding });

      try {
        const aiText = await generateAiText({
          providerChoice,
          task: "component",
          taskIndex: index,
          system:
            "Return JSON only. Create a safe VisualSceneSpec for a controlled Three.js renderer. No code, no JSX, no unsupported product claims. Actors must be story/product characters or stages, never controllers, routes, middleware, services, files, or functions.",
          prompt: JSON.stringify({
            appUnderstanding,
            scene,
            relatedRuntimeFlow: runtimeFlows.find((flow) => flow.id === scene.relatedRuntimeFlowId),
            requiredShape: {
              id: "string",
              title: "string",
              purpose: "string",
              camera: "wide | focused | journey | payoff",
              setting: "string",
              actors: "VisualActorSpec[]",
              motions: "VisualMotionSpec[]",
              narrationBeats: "string[]",
              evidence: "string[]"
            }
          }),
          temperature: 0.25
        });
        const parsed = aiText ? parseJson<Partial<VisualSceneSpec>>(aiText) : null;

        return {
          ...scene,
          visualSpec: parsed ? normalizeSceneSpec(parsed, fallback) : fallback
        };
      } catch {
        return {
          ...scene,
          visualSpec: fallback
        };
      }
    })
  );

  return {
    ...story,
    scenes
  };
}
