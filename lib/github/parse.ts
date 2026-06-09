export interface ParsedGitHubRepoUrl {
  owner: string;
  repo: string;
  branch?: string;
}

export function parseGitHubRepoUrl(value: string): ParsedGitHubRepoUrl | null {
  try {
    const url = new URL(value.trim());

    if (url.hostname !== "github.com") {
      return null;
    }

    const [owner, repo, tree, branch] = url.pathname
      .split("/")
      .filter(Boolean)
      .map((part) => part.replace(/\.git$/, ""));

    if (!owner || !repo) {
      return null;
    }

    return {
      owner,
      repo,
      branch: tree === "tree" ? branch : undefined
    };
  } catch {
    return null;
  }
}

