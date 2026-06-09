import type { RepoFile } from "@/lib/types/analysis";
import { getExtension } from "@/lib/scanner/file-rules";

export interface GitHubRepoMetadata {
  owner: string;
  repo: string;
  fullName: string;
  defaultBranch: string;
  htmlUrl: string;
  description: string | null;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

function rawFileUrl(owner: string, repo: string, branch: string, filePath: string) {
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`;
}

export async function fetchRepoMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubHeaders(),
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`GitHub metadata request failed with ${response.status}.`);
  }

  const data = (await response.json()) as {
    full_name: string;
    default_branch: string;
    html_url: string;
    description: string | null;
  };

  return {
    owner,
    repo,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    htmlUrl: data.html_url,
    description: data.description
  };
}

export async function fetchRepoTree(
  metadata: GitHubRepoMetadata,
  branch = metadata.defaultBranch
) {
  const response = await fetch(
    `https://api.github.com/repos/${metadata.owner}/${metadata.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    {
      headers: githubHeaders(),
      next: { revalidate: 60 }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub tree request failed with ${response.status}.`);
  }

  const data = (await response.json()) as GitHubTreeResponse;
  const files: RepoFile[] = data.tree
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: item.path,
      size: item.size ?? 0,
      extension: getExtension(item.path),
      selected: false,
      sha: item.sha,
      downloadUrl: rawFileUrl(metadata.owner, metadata.repo, branch, item.path)
    }));

  return {
    files,
    truncated: data.truncated
  };
}

