"use client";

import { motion } from "framer-motion";
import { ArrowRight, ClipboardList, GitBranch, RotateCcw, TerminalSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ModeSelector } from "@/components/analyze/mode-selector";
import { ProviderSelector } from "@/components/analyze/provider-selector";
import { StreamTimeline } from "@/components/analyze/stream-timeline";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button, buttonClassName } from "@/components/ui/button";
import { isAnalysisResult, writeStoredAnalysis } from "@/lib/storage/browser-analysis-store";
import { writeStoredAnalysisRecord } from "@/lib/storage/history";
import { extractSseBlocks, parseSseBlock } from "@/lib/stream/client";
import type { AiProviderChoice, AnalysisMode, AnalysisStreamEvent } from "@/lib/types/analysis";

const manualExample =
  "app/page.tsx\n---\nexport default function Page() { return <main>Hello</main>; }\n\ncomponents/card.tsx\n---\nexport function Card() { return <section />; }";

export function AnalyzeConsole({ initialRepo = "" }: { initialRepo?: string }) {
  const [repoUrl, setRepoUrl] = useState(initialRepo);
  const [mode, setMode] = useState<AnalysisMode>("balanced");
  const [aiProvider, setAiProvider] = useState<AiProviderChoice>("auto");
  const [manualFiles, setManualFiles] = useState("");
  const [events, setEvents] = useState<AnalysisStreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  async function startStream() {
    setError("");
    setAnalysisId(null);
    setEvents([]);

    if (!repoUrl.trim() && !manualFiles.trim()) {
      setError("Enter a GitHub URL or paste files manually.");
      return;
    }

    setIsStreaming(true);

    try {
      const response = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          repoUrl,
          mode,
          aiProvider,
          manualFiles
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Analyzer stream failed to start.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { completeBlocks, remainingBuffer } = extractSseBlocks(buffer);
        buffer = remainingBuffer;

        for (const block of completeBlocks) {
          const event = parseSseBlock(block);

          if (!event) {
            continue;
          }

          setEvents((current) => [...current, event]);

          if (event.type === "final") {
            const analysis = event.details?.analysis;
            const id =
              typeof event.details?.analysisId === "string"
                ? event.details.analysisId
                : isAnalysisResult(analysis)
                  ? analysis.id
                  : "";
            setAnalysisId(id);
            if (id) {
              writeStoredAnalysisRecord({
                id,
                repoUrl: repoUrl || "manual://pasted-files",
                mode,
                aiProvider,
                savedAt: new Date().toISOString()
              });
            }

            if (isAnalysisResult(analysis) && !writeStoredAnalysis(analysis)) {
              setError("Analysis completed, but this browser could not save a recovery copy.");
            }
          }

          if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (streamError) {
      setError(streamError instanceof Error ? streamError.message : "Unknown stream error.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-2">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TerminalSquare className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>Analyzer Console</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/history" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            History
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto mt-5 grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <section className="space-y-4">
          <motion.div
            className="panel rounded-lg p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GitBranch className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Live Repository Analysis</h1>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Streams GitHub/manual analysis stages as the analyzer works.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="analyze-url" className="mb-2 block text-sm font-semibold">
                  GitHub repository URL
                </label>
                <input
                  id="analyze-url"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/vercel/next.js"
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                />
              </div>

              <ModeSelector value={mode} onChange={setMode} />

              <ProviderSelector value={aiProvider} onChange={setAiProvider} />

              <div>
                <label htmlFor="manual-files" className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Manual fallback
                </label>
                <textarea
                  id="manual-files"
                  value={manualFiles}
                  onChange={(event) => setManualFiles(event.target.value)}
                  placeholder={manualExample}
                  className="min-h-36 w-full resize-y rounded-md border border-border bg-background p-3 text-sm outline-none transition focus:border-primary"
                />
              </div>

              {error ? (
                <p className="rounded-md border border-warning bg-warning/10 p-3 text-sm text-warning">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => startStream()} disabled={isStreaming}>
                  {isStreaming ? <RotateCcw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  Start stream
                </Button>
                {analysisId ? (
                  <Link href={`/result/${analysisId}`} className={buttonClassName({ variant: "outline" })}>
                    Open result
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        </section>

        <section aria-label="Streaming analyzer events">
          <StreamTimeline events={events} />
        </section>
      </main>
    </div>
  );
}
