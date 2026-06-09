import type { CodeNode, FeatureCluster, RepoFile } from "@/lib/types/analysis";
import { featureGroupForPath } from "@/lib/scanner/file-rules";

export function buildFeatureClusters(files: RepoFile[], nodes: CodeNode[]): FeatureCluster[] {
  const groups = new Map<string, { files: string[]; nodeIds: string[] }>();

  for (const file of files.filter((item) => item.selected && item.content)) {
    const group = featureGroupForPath(file.path);
    const current = groups.get(group) ?? { files: [], nodeIds: [] };
    current.files.push(file.path);
    groups.set(group, current);
  }

  for (const node of nodes) {
    const group = node.group ?? "core";
    const current = groups.get(group) ?? { files: [], nodeIds: [] };
    current.nodeIds.push(node.id);
    groups.set(group, current);
  }

  return Array.from(groups.entries())
    .map(([id, group]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      summary: `${group.files.length} selected file${group.files.length === 1 ? "" : "s"} and ${group.nodeIds.length} graph node${group.nodeIds.length === 1 ? "" : "s"} were grouped under ${id}.`,
      files: Array.from(new Set(group.files)).slice(0, 40),
      nodeIds: Array.from(new Set(group.nodeIds)).slice(0, 40)
    }))
    .sort((a, b) => b.files.length + b.nodeIds.length - (a.files.length + a.nodeIds.length))
    .slice(0, 12);
}

