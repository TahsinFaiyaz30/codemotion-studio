import { NextResponse } from "next/server";
import { fetchRepoMetadata, fetchRepoTree } from "@/lib/github/api";
import { parseGitHubRepoUrl } from "@/lib/github/parse";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { repoUrl?: string };
  const parsed = payload.repoUrl ? parseGitHubRepoUrl(payload.repoUrl) : null;

  if (!parsed) {
    return NextResponse.json({ ok: false, error: "Valid GitHub repository URL is required." }, { status: 400 });
  }

  const metadata = await fetchRepoMetadata(parsed.owner, parsed.repo);
  const branch = parsed.branch ?? metadata.defaultBranch;
  const tree = await fetchRepoTree(metadata, branch);

  return NextResponse.json({
    ok: true,
    repository: metadata,
    branch,
    truncated: tree.truncated,
    fileCount: tree.files.length,
    files: tree.files.slice(0, 500)
  });
}
