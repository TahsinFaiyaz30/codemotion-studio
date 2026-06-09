import { randomUUID } from "node:crypto";
import { generateAiText, getAiStatus } from "@/lib/ai/provider";
import { fetchRepoMetadata, fetchRepoTree } from "@/lib/github/api";
import { parseGitHubRepoUrl } from "@/lib/github/parse";
import { buildFeatureClusters } from "@/lib/scanner/cluster-builder";
import { forgeComponentSpec } from "@/lib/scanner/component-forge";
import { buildConnections } from "@/lib/scanner/connection-weaver";
import { scanDesignDNA } from "@/lib/scanner/design-dna-scanner";
import { fetchSelectedFileContents } from "@/lib/scanner/file-fetcher";
import { findFlows } from "@/lib/scanner/flow-finder";
import { planHugeRepo } from "@/lib/scanner/huge-repo-planner";
import { parseManualFiles } from "@/lib/scanner/manual-files";
import { forgePrompts } from "@/lib/scanner/prompt-forge";
import { synthesizeRuntimeFlows } from "@/lib/scanner/runtimeFlowSynthesizer";
import { mapAstFiles } from "@/lib/scanner/ast-mapper";
import { detectStack } from "@/lib/scanner/stack-detective";
import { generateCodebaseStory } from "@/lib/story/storyEngine";
import { planStoryComponents } from "@/lib/story/storyComponentPlanner";
import type { AnalysisMode, AnalysisResult, AnalysisStage, AnalysisStreamEvent, RepoFile } from "@/lib/types/analysis";

export interface AnalyzerInput {
  repoUrl?: string;
  mode: AnalysisMode;
  manualFiles?: string;
}

function event(
  type: AnalysisStreamEvent["type"],
  stage: AnalysisStage,
  message: string,
  progress: number,
  details?: Record<string, unknown>
): AnalysisStreamEvent {
  return {
    type,
    stage,
    message,
    progress,
    details
  };
}

function estimateContextSaved(totalBytes: number, selectedBytes: number) {
  if (!totalBytes) return 0;
  return Math.max(0, Math.min(99, Math.round((1 - selectedBytes / totalBytes) * 100)));
}

function keepResultFiles(files: RepoFile[]) {
  const selected = files.filter((file) => file.selected);
  const skipped = files.filter((file) => !file.selected).slice(0, 500);
  return [...selected, ...skipped];
}

export async function* runAnalyzer(input: AnalyzerInput): AsyncGenerator<AnalysisStreamEvent, AnalysisResult> {
  const mode = input.mode;
  const manualInput = input.manualFiles?.trim();
  let repoName = "Manual files";
  let repoUrl = "manual://pasted-files";
  let branch = "manual";
  let files: RepoFile[] = [];
  const warnings: string[] = [];

  yield event(
    "stage",
    "validating_github_url",
    manualInput ? "Validating pasted file bundle." : "Validating GitHub repository URL.",
    4,
    { mode }
  );

  if (manualInput) {
    files = parseManualFiles(manualInput);
    if (!files.length) {
      throw new Error("Manual fallback needs files in the format: path, then ---, then code.");
    }
  } else {
    if (!input.repoUrl) {
      throw new Error("Enter a public GitHub repository URL or paste files manually.");
    }

    const parsed = parseGitHubRepoUrl(input.repoUrl);
    if (!parsed) {
      throw new Error("Enter a valid GitHub repository URL.");
    }

    yield event("stage", "fetching_repo_metadata", "Fetching repository metadata from GitHub.", 9, {
      owner: parsed.owner,
      repo: parsed.repo
    });

    const metadata = await fetchRepoMetadata(parsed.owner, parsed.repo);
    repoName = metadata.fullName;
    repoUrl = metadata.htmlUrl;
    branch = parsed.branch ?? metadata.defaultBranch;

    yield event("stage", "fetching_repo_tree", "Fetching recursive repository tree from GitHub.", 16, {
      branch
    });

    const tree = await fetchRepoTree(metadata, branch);
    files = tree.files;

    if (tree.truncated) {
      warnings.push("GitHub returned a truncated tree. Results use the visible tree only.");
    }
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  yield event("stage", "planning_huge_repo_strategy", "Scoring files and applying huge repo budgets.", 24, {
    totalFiles: files.length,
    mode
  });

  const plan = planHugeRepo(files, mode);
  warnings.push(...plan.warnings);

  yield event("partial", "selecting_important_files", "Selected high-signal files and recorded skip reasons.", 34, {
    selected: plan.selectedFiles.length,
    skipped: plan.skippedFiles.length,
    byteBudget: plan.byteBudget
  });

  if (manualInput) {
    files = plan.files;
  } else {
    yield event("stage", "fetching_file_contents", "Fetching selected source files with byte limits.", 42, {
      selected: plan.selectedFiles.length
    });
    files = await fetchSelectedFileContents(plan.files);
  }

  const fetchedSelected = files.filter((file) => file.selected && file.content);
  const selectedBytes = fetchedSelected.reduce((sum, file) => sum + file.size, 0);

  yield event("stage", "parsing_ast", "Parsing selected JavaScript and TypeScript files with AST tools.", 53, {
    fetched: fetchedSelected.length
  });

  const parsedFiles = mapAstFiles(files);
  const parserWarningCount = parsedFiles.reduce((sum, file) => sum + file.errors.length, 0);

  if (parserWarningCount) {
    warnings.push(`${parserWarningCount} parser warning${parserWarningCount === 1 ? "" : "s"} were isolated.`);
  }

  yield event("stage", "detecting_stack", "Detecting stack from package files, paths, imports, and code signals.", 62, {
    parsedFiles: parsedFiles.length
  });

  const stack = detectStack(files, parsedFiles);

  yield event("stage", "mapping_imports", "Resolving imports, external packages, database signals, and graph links.", 70);

  const { nodes, edges } = buildConnections({
    repoName,
    files,
    parsedFiles
  });

  yield event("stage", "building_file_graph", "Built code graph nodes and edges.", 76, {
    nodes: nodes.length,
    edges: edges.length
  });

  const flows = findFlows(nodes);

  yield event("stage", "detecting_flows", "Detected likely user and system flows from file paths and graph nodes.", 80, {
    flows: flows.length
  });

  const designDNA = scanDesignDNA(files);

  yield event("stage", "extracting_design_dna", "Extracted design DNA from classes, CSS tokens, and component patterns.", 84, {
    colors: designDNA.colors.length,
    patterns: designDNA.componentPatterns.length
  });

  const clusters = buildFeatureClusters(files, nodes);

  yield event("stage", "grouping_feature_clusters", "Grouped selected files into feature clusters.", 88, {
    clusters: clusters.length
  });

  yield event(
    "stage",
    "synthesizing_runtime_flows",
    "Building real user journeys from routes, components, APIs, and database links.",
    89,
    { flows: flows.length, clusters: clusters.length }
  );

  const runtimeFlows = synthesizeRuntimeFlows({
    nodes,
    edges,
    parsedFiles,
    stack,
    clusters,
    flows
  });

  yield event("stage", "compressing_context", "Compressed analysis context for prompts and safe UI generation.", 91, {
    contextSaved: estimateContextSaved(totalBytes, selectedBytes)
  });

  const aiStatus = getAiStatus();
  let aiSummaryText: string | null = null;
  let aiAnalyzedClusters = 0;

  if (aiStatus.configured) {
    yield event("ai_activity", "running_ai_cluster_summaries", `AI is summarizing compressed clusters with ${aiStatus.provider}.`, 93, {
      provider: aiStatus.provider,
      model: aiStatus.model,
      clusters: clusters.map((cluster) => cluster.name)
    });

    try {
      aiSummaryText = await generateAiText({
        system: "You summarize codebase analysis facts. Never claim access to files not provided.",
        prompt: JSON.stringify({
          repoName,
          stack: stack.map((item) => item.name),
          clusters: clusters.map((cluster) => ({
            name: cluster.name,
            files: cluster.files.slice(0, 10),
            summary: cluster.summary
          })),
          runtimeFlows: runtimeFlows.map((flow) => ({
            name: flow.plainEnglishName,
            actor: flow.actor,
            userGoal: flow.userGoal,
            steps: flow.steps.map((step) => ({
              layer: step.layer,
              title: step.title,
              plainEnglish: step.plainEnglish
            }))
          }))
        })
      });
      aiAnalyzedClusters = aiSummaryText ? clusters.length : 0;
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "AI summary request failed.");
    }
  } else {
    yield event("log", "running_ai_cluster_summaries", "No AI key configured; local deterministic cluster summaries are based on real files.", 93, {
      clusters: clusters.map((cluster) => cluster.name)
    });
  }

  yield event(
    aiStatus.configured ? "ai_activity" : "stage",
    "generating_story_mode",
    aiStatus.configured
      ? "AI is turning the app into a normal-person story based on detected runtime flows."
      : "Generating Story Mode locally from detected runtime flows.",
    94,
    { runtimeFlows: runtimeFlows.length }
  );

  const story = await generateCodebaseStory({
    repoName,
    summary:
      aiSummaryText ??
      `${repoName} analyzed ${files.length} files and produced ${nodes.length} graph nodes.`,
    runtimeFlows,
    designDNA
  });

  yield event(
    "component_generation",
    "planning_story_components",
    "Planning animated UI components needed for the story.",
    95,
    { scenes: story.scenes.length }
  );

  const storyComponents = planStoryComponents({
    story,
    designDNA,
    runtimeFlows
  });

  yield event(
    "component_generation",
    "generating_story_component_specs",
    "Generated safe story animation component specs that match the current Design DNA.",
    96,
    { storyComponents: storyComponents.length }
  );

  const prompts = forgePrompts({
    repoName,
    stackNames: stack.map((item) => item.name),
    clusterNames: clusters.map((cluster) => cluster.name),
    flowNames: runtimeFlows.map((flow) => flow.plainEnglishName)
  });

  yield event("stage", "generating_prompts", "Generated prompts from compressed analysis facts.", 97, {
    prompts: prompts.length
  });

  const componentSpec = forgeComponentSpec({
    repoName,
    designDNA,
    primaryFlowName: flows[0]?.name ?? "application overview"
  });

  yield event("component_generation", "generating_dynamic_components", "Generated a safe ComponentSpec from real design DNA.", 98, {
    component: componentSpec.name
  });

  const result: AnalysisResult = {
    id: randomUUID(),
    repoName,
    repoUrl,
    branch,
    mode,
    createdAt: new Date().toISOString(),
    summary:
      aiSummaryText ??
      `${repoName} analyzed ${files.length} repository files, selected ${fetchedSelected.length} source files, parsed ${parsedFiles.length} AST-ready files, and produced ${nodes.length} graph nodes across ${clusters.length} clusters.`,
    stats: {
      totalFiles: files.length,
      filesScanned: files.length,
      filesSelected: fetchedSelected.length,
      filesSkipped: files.filter((file) => !file.selected).length,
      astParsedFiles: parsedFiles.length,
      aiAnalyzedClusters,
      estimatedContextSaved: estimateContextSaved(totalBytes, selectedBytes)
    },
    warnings,
    files: keepResultFiles(files),
    parsedFiles,
    clusters,
    stack,
    designDNA,
    nodes,
    edges,
    flows,
    runtimeFlows,
    story,
    storyComponents,
    prompts,
    componentSpec
  };

  yield event("stage", "composing_visualization", "Composed graph, flows, prompts, and ComponentSpec result.", 99, {
    analysisId: result.id
  });

  return result;
}
