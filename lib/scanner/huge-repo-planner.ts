import type { AnalysisMode, RepoFile } from "@/lib/types/analysis";
import { getSkipReason, scoreFile } from "@/lib/scanner/file-rules";

const budgets: Record<
  AnalysisMode,
  {
    maxFiles: number;
    byteBudget: number;
    maxFileBytes: number;
  }
> = {
  fast: { maxFiles: 70, byteBudget: 650_000, maxFileBytes: 120_000 },
  balanced: { maxFiles: 150, byteBudget: 1_450_000, maxFileBytes: 180_000 },
  deep: { maxFiles: 300, byteBudget: 3_000_000, maxFileBytes: 240_000 },
  huge: { maxFiles: 240, byteBudget: 2_200_000, maxFileBytes: 160_000 }
};

export function planHugeRepo(files: RepoFile[], mode: AnalysisMode) {
  const budget = budgets[mode];
  const scoredFiles = files.map((file) => ({
    ...file,
    score: scoreFile(file.path, file.size)
  }));
  const sorted = [...scoredFiles].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const selectedPaths = new Set<string>();
  let selectedBytes = 0;
  const warnings: string[] = [];

  for (const file of sorted) {
    const skipReason = getSkipReason(file.path, file.size);

    if (skipReason) {
      file.selected = false;
      file.skippedReason = skipReason;
      continue;
    }

    if (file.size > budget.maxFileBytes) {
      file.selected = false;
      file.skippedReason = "over_per_file_byte_limit";
      continue;
    }

    if (selectedPaths.size >= budget.maxFiles) {
      file.selected = false;
      file.skippedReason = "over_selected_file_budget";
      continue;
    }

    if (selectedBytes + file.size > budget.byteBudget) {
      file.selected = false;
      file.skippedReason = "over_total_byte_budget";
      continue;
    }

    file.selected = true;
    selectedPaths.add(file.path);
    selectedBytes += file.size;
  }

  if (files.length > 2000 && mode !== "huge") {
    warnings.push("Repository is large; huge mode would apply stricter budgets and skip more low-signal files.");
  }

  const plannedFiles = scoredFiles.map((file) => {
    const planned = sorted.find((candidate) => candidate.path === file.path);
    return planned ?? file;
  });

  return {
    files: plannedFiles,
    selectedFiles: plannedFiles.filter((file) => file.selected),
    skippedFiles: plannedFiles.filter((file) => !file.selected),
    selectedBytes,
    byteBudget: budget.byteBudget,
    maxFiles: budget.maxFiles,
    warnings
  };
}

