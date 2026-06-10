"use client";

import { useEffect, useState } from "react";
import { MissingResult } from "@/components/result/missing-result";
import { ResultDashboard } from "@/components/result/result-dashboard";
import { readStoredAnalysis, writeStoredAnalysis } from "@/lib/storage/browser-analysis-store";
import type { AnalysisResult } from "@/lib/types/analysis";

export function RecoverableMissingResult({ analysisId }: { analysisId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [checkedBrowserCache, setCheckedBrowserCache] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cachedAnalysis = readStoredAnalysis(analysisId);

    async function upgradeCachedAnalysis(cached: AnalysisResult) {
      setIsUpgrading(true);

      try {
        const response = await fetch("/api/analyze/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: cached })
        });
        const payload = (await response.json()) as { ok?: boolean; analysis?: AnalysisResult };

        if (!cancelled && response.ok && payload.ok && payload.analysis) {
          writeStoredAnalysis(payload.analysis);
          setAnalysis(payload.analysis);
          return;
        }
      } catch {
        // Render the cached copy below if the upgrade endpoint is unavailable.
      }

      if (!cancelled) {
        setAnalysis(cached);
      }
    }

    if (!cachedAnalysis) {
      setCheckedBrowserCache(true);
      return () => {
        cancelled = true;
      };
    }

    setCheckedBrowserCache(true);
    void upgradeCachedAnalysis(cachedAnalysis).finally(() => {
      if (!cancelled) {
        setIsUpgrading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (isUpgrading) {
    return (
      <main className="min-h-screen px-4 py-10">
        <section className="panel mx-auto max-w-2xl rounded-lg p-6">
          <p className="text-xs font-bold uppercase text-primary">Recovering saved analysis</p>
          <h1 className="mt-2 text-2xl font-black">Upgrading this result to the new story engine</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            CodeMotion found a browser-saved analysis and is rebuilding its Actual App Flow and Story Mode before showing it.
          </p>
        </section>
      </main>
    );
  }

  if (analysis) {
    return <ResultDashboard analysis={analysis} />;
  }

  return <MissingResult analysisId={analysisId} checkedBrowserCache={checkedBrowserCache} />;
}
