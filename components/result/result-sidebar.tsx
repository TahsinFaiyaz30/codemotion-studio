"use client";

import { Boxes, Filter, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

export function ResultSidebar({
  analysis,
  selectedNodeId,
  onSelectNode
}: {
  analysis: AnalysisResult;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}) {
  const groups = Array.from(new Set(analysis.nodes.map((node) => node.group).filter(Boolean)));

  return (
    <aside className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <FolderTree className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-bold">Repo Map</h2>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Feature filters
        </div>
        <div className="flex flex-wrap gap-1.5">
          {groups.map((group) => (
            <Badge key={group}>{group}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {analysis.nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectNode(node.id)}
            className={cn(
              "w-full rounded-md border border-border bg-background p-3 text-left transition hover:border-primary",
              selectedNodeId === node.id && "border-primary bg-primary/10"
            )}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Boxes className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {node.label}
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {node.path ?? node.kind}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

