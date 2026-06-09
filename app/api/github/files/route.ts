import { NextResponse } from "next/server";
import { fetchRepoMetadata, fetchRepoTree } from "@/lib/github/api";
import { parseGitHubRepoUrl } from "@/lib/github/parse";
import { fetchSelectedFileContents } from "@/lib/scanner/file-fetcher";
import { planHugeRepo } from "@/lib/scanner/huge-repo-planner";
import type { AnalysisMode } from "@/lib/types/analysis";

const modes: AnalysisMode[] = ["fast", "balanced", "deep", "huge"];

function isAnalysisMode(value: unknown): value is AnalysisMode {
  return typeof value === "string" && modes.includes(value as AnalysisMode);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    repoUrl?: string;
    mode?: unknown;
  };
  const parsed = payload.repoUrl ? parseGitHubRepoUrl(payload.repoUrl) : null;

  if (!parsed) {
    return NextResponse.json({ ok: false, error: "Valid GitHub repository URL is required." }, { status: 400 });
  }

  const metadata = await fetchRepoMetadata(parsed.owner, parsed.repo);
  const branch = parsed.branch ?? metadata.defaultBranch;
  const tree = await fetchRepoTree(metadata, branch);
  const plan = planHugeRepo(tree.files, isAnalysisMode(payload.mode) ? payload.mode : "balanced");
  const files = await fetchSelectedFileContents(plan.files);

  return NextResponse.json({
    ok: true,
    repository: metadata.fullName,
    branch,
    selected: files.filter((file) => file.selected && file.content)
  });
}
