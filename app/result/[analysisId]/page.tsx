import { ResultDashboard } from "@/components/result/result-dashboard";
import { MissingResult } from "@/components/result/missing-result";
import { getAnalysisResult } from "@/lib/storage/analysis-store";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;
  const analysis = getAnalysisResult(analysisId);

  if (!analysis) {
    return <MissingResult analysisId={analysisId} />;
  }

  return <ResultDashboard analysis={analysis} />;
}

