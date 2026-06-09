"use client";

import { useEffect, useState } from "react";
import { MissingResult } from "@/components/result/missing-result";
import { ResultDashboard } from "@/components/result/result-dashboard";
import { readStoredAnalysis } from "@/lib/storage/browser-analysis-store";
import type { AnalysisResult } from "@/lib/types/analysis";

export function RecoverableMissingResult({ analysisId }: { analysisId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [checkedBrowserCache, setCheckedBrowserCache] = useState(false);

  useEffect(() => {
    setAnalysis(readStoredAnalysis(analysisId));
    setCheckedBrowserCache(true);
  }, [analysisId]);

  if (analysis) {
    return <ResultDashboard analysis={analysis} />;
  }

  return <MissingResult analysisId={analysisId} checkedBrowserCache={checkedBrowserCache} />;
}
