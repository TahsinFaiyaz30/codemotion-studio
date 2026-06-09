import { ResultDashboard } from "@/components/result/result-dashboard";
import { RecoverableMissingResult } from "@/components/result/recoverable-missing-result";
import { getAnalysisResult, saveAnalysisResult } from "@/lib/storage/analysis-store";
import { ensureAnalysisLayers } from "@/lib/story/ensureAnalysisLayers";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;
  const analysis = getAnalysisResult(analysisId);

  if (!analysis) {
    return <RecoverableMissingResult analysisId={analysisId} />;
  }

  const upgradedAnalysis = await ensureAnalysisLayers(analysis);
  saveAnalysisResult(upgradedAnalysis);

  return <ResultDashboard analysis={upgradedAnalysis} />;
}
