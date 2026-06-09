import type { AnalysisResult, PromptCard } from "@/lib/types/analysis";

export function forgePrompts(input: {
  repoName: string;
  stackNames: string[];
  clusterNames: string[];
  flowNames: string[];
}): PromptCard[] {
  const stack = input.stackNames.join(", ") || "the detected stack";
  const clusters = input.clusterNames.join(", ") || "the major feature areas";
  const flows = input.flowNames.join(", ") || "the main application flow";

  return [
    {
      id: "tiny",
      title: "Tiny Prompt",
      body: `Build a project like ${input.repoName} using ${stack}. Focus on ${clusters}.`
    },
    {
      id: "codex",
      title: "One-Shot Codex Prompt",
      body: `Create a production-quality application inspired by ${input.repoName}. Use ${stack}. Implement the feature clusters ${clusters}, map the flows ${flows}, keep modules focused, and add typed reusable UI components.`
    },
    {
      id: "ui",
      title: "UI-Only Prompt",
      body: `Design the UI for an app like ${input.repoName}. Match the detected component patterns, spacing, theme behavior, and visual tone from the analyzed files.`
    },
    {
      id: "backend",
      title: "Backend-Only Prompt",
      body: `Implement the backend surfaces for ${input.repoName}: API routes, services, data access, validation, auth boundaries, and error handling for ${flows}.`
    },
    {
      id: "refactor",
      title: "Refactor Prompt",
      body: `Refactor ${input.repoName} by splitting large files into single-responsibility modules, preserving imports, strengthening typed contracts, and adding focused tests around ${clusters}.`
    }
  ];
}

export function promptsFromAnalysis(analysis: AnalysisResult) {
  return forgePrompts({
    repoName: analysis.repoName,
    stackNames: analysis.stack.map((item) => item.name),
    clusterNames: analysis.clusters.map((cluster) => cluster.name),
    flowNames: analysis.flows.map((flow) => flow.name)
  });
}

