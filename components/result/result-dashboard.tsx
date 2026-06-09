"use client";

import { Download, Home, Save, Sparkles, TerminalSquare } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ComponentForgePreview } from "@/components/component-forge/component-forge-preview";
import { CodeFlowGraph } from "@/components/graph/code-flow-graph";
import { PromptMaker } from "@/components/prompt-maker/prompt-maker";
import { ResultTabs, type ResultMode } from "@/components/result/ResultTabs";
import { InspectorPanel } from "@/components/result/inspector-panel";
import { ResultSidebar } from "@/components/result/result-sidebar";
import { RuntimeFlowPanel } from "@/components/runtime-flow/RuntimeFlowPanel";
import { StackDnaPanel } from "@/components/stack-dna/stack-dna-panel";
import { StoryModePanel } from "@/components/story/StoryModePanel";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { writeStoredAnalysis } from "@/lib/storage/browser-analysis-store";
import { writeStoredAnalysisRecord } from "@/lib/storage/history";
import type { AnalysisResult } from "@/lib/types/analysis";
import { cn, formatNumber } from "@/lib/utils";

type ResultPanel = "stack" | "prompts" | "component";

const panels: Array<{ id: ResultPanel; label: string }> = [
  { id: "stack", label: "Stack" },
  { id: "prompts", label: "Prompts" },
  { id: "component", label: "Generate UI" }
];

export function ResultDashboard({ analysis }: { analysis: AnalysisResult }) {
  const [selectedNodeId, setSelectedNodeId] = useState(analysis.nodes[0]?.id ?? "");
  const [activeMode, setActiveMode] = useState<ResultMode>("graph");
  const [activePanel, setActivePanel] = useState<ResultPanel>("stack");
  const [saved, setSaved] = useState(false);
  const selectedNode = useMemo(
    () => analysis.nodes.find((node) => node.id === selectedNodeId) ?? analysis.nodes[0],
    [analysis.nodes, selectedNodeId]
  );

  function saveResult() {
    writeStoredAnalysisRecord({
      id: analysis.id,
      repoUrl: analysis.repoUrl,
      mode: analysis.mode,
      savedAt: new Date().toISOString()
    });
    writeStoredAnalysis(analysis);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  function exportSummary() {
    const payload = JSON.stringify(analysis, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${analysis.id}-codemotion-analysis.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className={buttonClassName({ variant: "outline", size: "icon" })} aria-label="Home">
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{analysis.repoUrl}</p>
            <h1 className="truncate text-xl font-black">{analysis.repoName}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Real analysis
          </Badge>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={saveResult}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="secondary" size="sm" onClick={exportSummary}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </div>
      </header>

      <main className="mx-auto mt-5 max-w-7xl space-y-4">
        <section className="panel rounded-lg p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="font-bold">Analysis Summary</h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
            </div>
            {[
              ["Files scanned", formatNumber(analysis.stats.filesScanned)],
              ["Skipped safely", formatNumber(analysis.stats.filesSkipped)],
              ["AST parsed", formatNumber(analysis.stats.astParsedFiles)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <ResultTabs activeMode={activeMode} onChange={setActiveMode} />

        {activeMode === "graph" ? (
          <section className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
            <ResultSidebar
              analysis={analysis}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
            <CodeFlowGraph
              nodes={analysis.nodes}
              edges={analysis.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
            {selectedNode ? <InspectorPanel analysis={analysis} node={selectedNode} /> : null}
          </section>
        ) : null}

        {activeMode === "runtime" ? (
          <RuntimeFlowPanel runtimeFlows={analysis.runtimeFlows} />
        ) : null}

        {activeMode === "story" ? (
          <StoryModePanel story={analysis.story} storyComponents={analysis.storyComponents} />
        ) : null}

        <section className={activeMode === "graph" ? "" : "pt-1"}>
          <div className="mb-3 flex flex-wrap gap-2">
            {panels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActivePanel(panel.id)}
                className={cn(
                  "h-9 rounded-md border border-border bg-card px-3 text-sm font-bold transition hover:border-primary",
                  activePanel === panel.id && "border-primary bg-primary/10 text-primary"
                )}
              >
                {panel.label}
              </button>
            ))}
          </div>

          {activePanel === "stack" ? <StackDnaPanel analysis={analysis} /> : null}
          {activePanel === "prompts" ? <PromptMaker prompts={analysis.prompts} /> : null}
          {activePanel === "component" ? (
            <ComponentForgePreview spec={analysis.componentSpec} />
          ) : null}
        </section>
      </main>
    </div>
  );
}
