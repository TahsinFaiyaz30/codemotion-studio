import path from "node:path";
import type { CodeEdge, CodeNode, ParsedFileAst, RepoFile } from "@/lib/types/analysis";
import { classifyNodeKind, featureGroupForPath, labelFromPath, normalizeRepoPath } from "@/lib/scanner/file-rules";

function fileNodeId(filePath: string) {
  return `file:${normalizeRepoPath(filePath)}`;
}

function externalNodeId(packageName: string) {
  return `external:${packageName}`;
}

function isRelativeImport(specifier: string) {
  return specifier.startsWith(".");
}

function resolveImport(fromPath: string, specifier: string, availablePaths: Set<string>) {
  if (!isRelativeImport(specifier)) {
    return null;
  }

  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), specifier));
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.posix.join(base, "index.ts"),
    path.posix.join(base, "index.tsx"),
    path.posix.join(base, "index.js"),
    path.posix.join(base, "index.jsx")
  ].map(normalizeRepoPath);

  return candidates.find((candidate) => availablePaths.has(candidate)) ?? null;
}

function packageNameFromImport(specifier: string) {
  if (specifier.startsWith("@")) {
    return specifier.split("/").slice(0, 2).join("/");
  }

  return specifier.split("/")[0];
}

function addEdge(edges: CodeEdge[], edge: CodeEdge) {
  if (!edges.some((candidate) => candidate.id === edge.id)) {
    edges.push(edge);
  }
}

export function buildConnections({
  repoName,
  files,
  parsedFiles
}: {
  repoName: string;
  files: RepoFile[];
  parsedFiles: ParsedFileAst[];
}) {
  const parsedByPath = new Map(parsedFiles.map((file) => [normalizeRepoPath(file.path), file]));
  const availablePaths = new Set(parsedFiles.map((file) => normalizeRepoPath(file.path)));
  const selectedFiles = files
    .filter((file) => file.selected && file.content)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 120);
  const nodes: CodeNode[] = [
    {
      id: "repo",
      label: repoName,
      kind: "repo",
      importance: 100,
      summary: "Repository root and analysis anchor."
    }
  ];
  const edges: CodeEdge[] = [];
  const externalImportCounts = new Map<string, number>();

  for (const file of selectedFiles) {
    const parsed = parsedByPath.get(normalizeRepoPath(file.path));
    const kind = classifyNodeKind(file.path);
    const components = parsed?.components.length ? ` Components: ${parsed.components.slice(0, 4).join(", ")}.` : "";
    const handlers = parsed?.apiHandlers.length ? ` API handlers: ${parsed.apiHandlers.join(", ")}.` : "";

    nodes.push({
      id: fileNodeId(file.path),
      label: labelFromPath(file.path),
      path: file.path,
      kind,
      group: featureGroupForPath(file.path),
      importance: Math.min(100, Math.round(file.score ?? 10)),
      summary: `${file.path} is a ${kind} file selected by the repo planner.${components}${handlers}`
    });

    addEdge(edges, {
      id: `edge:repo:${file.path}`,
      source: "repo",
      target: fileNodeId(file.path),
      type: "feature-link",
      reason: "Selected by the huge repo planner.",
      confidence: 0.62
    });
  }

  const includedNodeIds = new Set(nodes.map((node) => node.id));

  for (const parsed of parsedFiles) {
    const sourceId = fileNodeId(parsed.path);
    if (!includedNodeIds.has(sourceId)) continue;

    for (const specifier of parsed.imports) {
      const targetPath = resolveImport(parsed.path, specifier, availablePaths);

      if (targetPath && includedNodeIds.has(fileNodeId(targetPath))) {
        addEdge(edges, {
          id: `edge:import:${parsed.path}:${targetPath}`,
          source: sourceId,
          target: fileNodeId(targetPath),
          type: "imports",
          reason: `${parsed.path} imports ${specifier}.`,
          confidence: 0.9
        });
      } else if (!isRelativeImport(specifier)) {
        const packageName = packageNameFromImport(specifier);
        externalImportCounts.set(packageName, (externalImportCounts.get(packageName) ?? 0) + 1);
      }
    }

    if (parsed.dbSignals.length) {
      const databaseId = "database:detected";
      if (!includedNodeIds.has(databaseId)) {
        nodes.push({
          id: databaseId,
          label: "Database",
          kind: "database",
          group: "data",
          importance: 82,
          summary: "Database layer inferred from database client symbols."
        });
        includedNodeIds.add(databaseId);
      }
      addEdge(edges, {
        id: `edge:db:${parsed.path}`,
        source: sourceId,
        target: databaseId,
        type: "db-read",
        reason: `Database signals detected: ${parsed.dbSignals.slice(0, 4).join(", ")}.`,
        confidence: 0.72
      });
    }
  }

  for (const [packageName, count] of Array.from(externalImportCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)) {
    const id = externalNodeId(packageName);
    nodes.push({
      id,
      label: packageName,
      kind: "external",
      group: "external",
      importance: Math.min(90, 45 + count * 6),
      summary: `${packageName} is imported by ${count} selected file${count === 1 ? "" : "s"}.`
    });
    includedNodeIds.add(id);

    for (const parsed of parsedFiles.filter((file) =>
      file.imports.some((specifier) => packageNameFromImport(specifier) === packageName)
    ).slice(0, 8)) {
      const sourceId = fileNodeId(parsed.path);
      if (!includedNodeIds.has(sourceId)) continue;
      addEdge(edges, {
        id: `edge:external:${parsed.path}:${packageName}`,
        source: sourceId,
        target: id,
        type: "imports",
        reason: `${parsed.path} imports ${packageName}.`,
        confidence: 0.82
      });
    }
  }

  return {
    nodes,
    edges: edges.slice(0, 240)
  };
}

