import { AnalyzeConsole } from "@/components/analyze/analyze-console";

export default async function AnalyzePage({
  searchParams
}: {
  searchParams?: Promise<{ repo?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return <AnalyzeConsole initialRepo={params?.repo ?? ""} />;
}

