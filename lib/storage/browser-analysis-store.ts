import type { AnalysisResult } from "@/lib/types/analysis";

export const BROWSER_ANALYSIS_STORAGE_PREFIX = "codemotion:analysis:";

export function toBrowserSafeAnalysis(analysis: AnalysisResult): AnalysisResult {
  return {
    ...analysis,
    files: analysis.files.map((file) => {
      const { content: _content, ...persistedFile } = file;
      return persistedFile;
    })
  };
}

export function getStoredAnalysisKey(id: string) {
  return `${BROWSER_ANALYSIS_STORAGE_PREFIX}${id}`;
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AnalysisResult>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.repoName === "string" &&
    typeof candidate.repoUrl === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.files) &&
    Array.isArray(candidate.parsedFiles) &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges) &&
    Array.isArray(candidate.runtimeFlows) &&
    typeof candidate.story === "object" &&
    candidate.story !== null
  );
}

export function writeStoredAnalysis(analysis: AnalysisResult) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      getStoredAnalysisKey(analysis.id),
      JSON.stringify(toBrowserSafeAnalysis(analysis))
    );
    return true;
  } catch {
    return false;
  }
}

export function readStoredAnalysis(id: string): AnalysisResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getStoredAnalysisKey(id));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAnalysisResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
