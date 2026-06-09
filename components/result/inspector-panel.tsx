import { Activity, FileCode2, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult, CodeNode } from "@/lib/types/analysis";

function connectedEdges(analysis: AnalysisResult, node: CodeNode) {
  return analysis.edges.filter((edge) => edge.source === node.id || edge.target === node.id);
}

export function InspectorPanel({
  analysis,
  node
}: {
  analysis: AnalysisResult;
  node: CodeNode;
}) {
  const edges = connectedEdges(analysis, node);

  return (
    <aside className="panel rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileCode2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-muted-foreground">{node.kind}</p>
          <h2 className="truncate text-xl font-black">{node.label}</h2>
          {node.path ? <p className="mt-1 truncate text-xs text-muted-foreground">{node.path}</p> : null}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{node.summary}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Importance</p>
          <p className="text-lg font-black">{node.importance}</p>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs text-muted-foreground">Links</p>
          <p className="text-lg font-black">{edges.length}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
          Connections
        </div>
        <div className="space-y-2">
          {edges.map((edge) => (
            <div key={edge.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{edge.type}</Badge>
                <span className="text-xs font-semibold">{Math.round(edge.confidence * 100)}%</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{edge.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          Scan Stats
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted p-2">
            <span className="block text-xs text-muted-foreground">AST parsed</span>
            <strong>{analysis.stats.astParsedFiles}</strong>
          </div>
          <div className="rounded-md bg-muted p-2">
            <span className="block text-xs text-muted-foreground">Context saved</span>
            <strong>{analysis.stats.estimatedContextSaved}%</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}

