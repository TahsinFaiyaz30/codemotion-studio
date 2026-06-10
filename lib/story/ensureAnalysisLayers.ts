import { synthesizeProductRuntimeFlows } from "@/lib/scanner/product-flow-synthesizer";
import { synthesizeRuntimeFlows } from "@/lib/scanner/runtimeFlowSynthesizer";
import {
  hasLegacyStory,
  hasTechnicalRuntimeLeak,
  hasWeakAppUnderstanding
} from "@/lib/story/analysisLayerHealth";
import { synthesizeAppUnderstanding } from "@/lib/story/appUnderstanding";
import { buildProductSummary } from "@/lib/story/productSummary";
import { generateCodebaseStory } from "@/lib/story/storyEngine";
import { planStoryComponents } from "@/lib/story/storyComponentPlanner";
import {
  enrichRuntimeFlowsWithVisualSpecs,
  enrichStoryWithVisualSpecs
} from "@/lib/story/visualSpecPlanner";
import type { AnalysisResult, AppUnderstanding } from "@/lib/types/analysis";

export async function ensureAnalysisLayers(analysis: AnalysisResult): Promise<AnalysisResult> {
  const sourceRuntimeFlows =
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
  let appUnderstanding: AppUnderstanding;

  if (hasWeakAppUnderstanding(analysis.appUnderstanding)) {
    appUnderstanding = await synthesizeAppUnderstanding({
      repoName: analysis.repoName,
      summary: analysis.summary,
      files: analysis.files,
      parsedFiles: analysis.parsedFiles,
      runtimeFlows: sourceRuntimeFlows,
      clusters: analysis.clusters,
      folderReports: analysis.folderReports ?? [],
      designDNA: analysis.designDNA,
      providerChoice: analysis.aiProviderChoice
    });
  } else {
    appUnderstanding = analysis.appUnderstanding!;
  }
  const productSummary = buildProductSummary(appUnderstanding);
  let runtimeFlows = synthesizeProductRuntimeFlows({
    appUnderstanding,
    runtimeFlows: sourceRuntimeFlows.filter((flow) => !hasTechnicalRuntimeLeak(flow)),
    folderReports: analysis.folderReports ?? [],
    files: analysis.files,
    parsedFiles: analysis.parsedFiles
  });

  if (!runtimeFlows.length) {
    runtimeFlows = synthesizeProductRuntimeFlows({
      appUnderstanding,
      runtimeFlows: sourceRuntimeFlows,
      folderReports: analysis.folderReports ?? [],
      files: analysis.files,
      parsedFiles: analysis.parsedFiles
    });
  }

  runtimeFlows = await enrichRuntimeFlowsWithVisualSpecs({
    runtimeFlows,
    appUnderstanding,
    providerChoice: analysis.aiProviderChoice
  });

  const storyWasLegacy = hasLegacyStory(analysis.story);
  let story =
    storyWasLegacy
      ? await generateCodebaseStory({
          repoName: analysis.repoName,
          summary: productSummary,
          runtimeFlows,
          designDNA: analysis.designDNA,
          appUnderstanding,
          folderReports: analysis.folderReports ?? [],
          providerChoice: analysis.aiProviderChoice
        })
      : analysis.story;
  story =
    story.scenes.every((scene) => scene.visualSpec) && !storyWasLegacy
      ? story
      : await enrichStoryWithVisualSpecs({
          story,
          runtimeFlows,
          appUnderstanding,
          providerChoice: analysis.aiProviderChoice
        });
  const storyComponents =
    storyWasLegacy || !analysis.storyComponents?.length
      ? planStoryComponents({
          story,
          designDNA: analysis.designDNA,
          runtimeFlows
        })
      : analysis.storyComponents;

  return {
    ...analysis,
    summary: productSummary,
    runtimeFlows,
    appUnderstanding,
    story,
    storyComponents
  };
}
