import type { RepoFile } from "@/lib/types/analysis";
import { getExtension, normalizeRepoPath } from "@/lib/scanner/file-rules";

function isHeader(lines: string[], index: number) {
  return Boolean(lines[index]?.trim()) && lines[index + 1]?.trim() === "---";
}

export function parseManualFiles(input: string): RepoFile[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const files: RepoFile[] = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;

    if (!isHeader(lines, index)) {
      index += 1;
      continue;
    }

    const filePath = normalizeRepoPath(lines[index].trim());
    index += 2;
    const contentLines: string[] = [];

    while (index < lines.length && !isHeader(lines, index)) {
      contentLines.push(lines[index]);
      index += 1;
    }

    const content = contentLines.join("\n").trimEnd();

    if (filePath && content) {
      files.push({
        path: filePath,
        content,
        size: new TextEncoder().encode(content).byteLength,
        extension: getExtension(filePath),
        selected: true,
        score: 100
      });
    }
  }

  return files;
}

