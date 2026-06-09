import type {
  CodebaseStory,
  DesignDNA,
  RuntimeFlow,
  StoryAnimationComponentSpec,
  StoryComponentType,
  StoryMotionType
} from "@/lib/types/analysis";

const componentByAnimation: Record<string, StoryComponentType> = {
  "hero-intro": "browser-window",
  "ui-click": "phone-mockup",
  "data-travel": "data-packet",
  "api-tunnel": "api-tunnel",
  "database-pulse": "database-orb",
  "stack-reveal": "stack-badge",
  "feature-tour": "feature-spotlight",
  "before-after": "animated-card",
  "problem-solution": "animated-card",
  ending: "flow-map"
};

const motionByAnimation: Record<string, StoryMotionType> = {
  "hero-intro": "reveal",
  "ui-click": "scale",
  "data-travel": "packet-travel",
  "api-tunnel": "slide",
  "database-pulse": "pulse",
  "stack-reveal": "reveal",
  "feature-tour": "slide",
  "before-after": "morph",
  "problem-solution": "fade",
  ending: "reveal"
};

export function planStoryComponents(input: {
  story: CodebaseStory;
  designDNA: DesignDNA;
  runtimeFlows: RuntimeFlow[];
}): StoryAnimationComponentSpec[] {
  return input.story.scenes.map((scene, index) => {
    const flow = input.runtimeFlows.find((item) => item.id === scene.relatedRuntimeFlowId);
    const componentType = componentByAnimation[scene.animationType] ?? "animated-card";

    return {
      name: `${scene.title.replace(/[^a-zA-Z0-9]+/g, "") || "Story"}Scene`,
      purpose: `Render the "${scene.title}" story scene while matching detected design DNA.`,
      sceneId: scene.id,
      matchesDesignDNA: true,
      componentType,
      props: {
        title: scene.title,
        narration: scene.narration,
        flowName: flow?.plainEnglishName ?? scene.relatedRuntimeFlowId,
        colors: input.designDNA.colors.slice(0, 4),
        visualTone: input.designDNA.visualTone
      },
      layout: {
        radius: input.designDNA.radius[0] ?? "rounded-lg",
        density: "responsive story panel",
        tone: input.designDNA.visualTone
      },
      animation: {
        motion: motionByAnimation[scene.animationType] ?? "fade",
        duration: scene.durationHintSeconds,
        sequenceOrder: index + 1
      },
      responsiveBehavior: "Desktop uses cinematic scene panels; mobile becomes a vertical story timeline.",
      accessibilityNotes: [
        "Narration is visible text, not animation-only content.",
        "Scene controls are buttons with readable labels."
      ]
    };
  });
}

