import type { RepoFile } from "@/lib/types/analysis";

async function fetchTextFile(file: RepoFile) {
  if (!file.downloadUrl) {
    return {
      ...file,
      selected: false,
      skippedReason: "missing_download_url"
    };
  }

  const response = await fetch(file.downloadUrl, {
    headers: process.env.GITHUB_TOKEN
      ? {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      : undefined
  });

  if (!response.ok) {
    return {
      ...file,
      selected: false,
      skippedReason: `fetch_failed_${response.status}`
    };
  }

  const content = await response.text();

  return {
    ...file,
    content,
    size: new TextEncoder().encode(content).byteLength
  };
}

export async function fetchSelectedFileContents(files: RepoFile[], concurrency = 8) {
  const selectedFiles = files.filter((file) => file.selected);
  const fetchedFiles: RepoFile[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < selectedFiles.length) {
      const index = cursor;
      cursor += 1;
      fetchedFiles[index] = await fetchTextFile(selectedFiles[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, selectedFiles.length) }, () => worker())
  );

  const byPath = new Map(fetchedFiles.map((file) => [file.path, file]));
  return files.map((file) => byPath.get(file.path) ?? file);
}

