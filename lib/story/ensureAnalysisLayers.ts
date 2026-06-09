import { synthesizeRuntimeFlows } from "@/lib/scanner/runtimeFlowSynthesizer";
import { generateCodebaseStory } from "@/lib/story/storyEngine";
import { planStoryComponents } from "@/lib/story/storyComponentPlanner";
import type { AnalysisResult } from "@/lib/types/analysis";

export async function ensureAnalysisLayers(analysis: AnalysisResult): Promise<AnalysisResult> {
  const runtimeFlows =
    analysis.runtimeFlows?.length
      ? analysis.runtimeFlows
      : synthesizeRuntimeFlows({
          nodes: analysis.nodes,
          edges: analysis.edges,
          parsedFiles: analysis.parsedFiles,
          stack: analysis.stack,
          clusters: analysis.clusters,
          flows: analysis.flows
        });
  const story =
    analysis.story?.scenes?.length
      ? analysis.story
      : await generateCodebaseStory({
          repoName: analysis.repoName,
          summary: analysis.summary,
          runtimeFlows,
          designDNA: analysis.designDNA
        });
  const storyComponents =
    analysis.storyComponents?.length
      ? analysis.storyComponents
      : planStoryComponents({
          story,
          designDNA: analysis.designDNA,
          runtimeFlows
        });

  return {
    ...analysis,
    runtimeFlows,
    story,
    storyComponents
  };
}

