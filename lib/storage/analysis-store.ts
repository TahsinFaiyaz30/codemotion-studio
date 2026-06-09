import type { AnalysisResult } from "@/lib/types/analysis";

const globalForStore = globalThis as typeof globalThis & {
  __codemotionAnalysisStore?: Map<string, AnalysisResult>;
};

export const analysisStore =
  globalForStore.__codemotionAnalysisStore ?? new Map<string, AnalysisResult>();

globalForStore.__codemotionAnalysisStore = analysisStore;

export function saveAnalysisResult(result: AnalysisResult) {
  analysisStore.set(result.id, result);
  return result.id;
}

export function getAnalysisResult(id: string) {
  return analysisStore.get(id) ?? null;
}

