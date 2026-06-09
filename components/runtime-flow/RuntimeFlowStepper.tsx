"use client";

import { CheckCircle2, Code2, MousePointerClick } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { RuntimeFlow } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

export function RuntimeFlowStepper({ flow }: { flow: RuntimeFlow }) {
  const [detailMode, setDetailMode] = useState<"simple" | "technical">("simple");

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black">{flow.plainEnglishName}</h3>
            <Badge>{Math.round(flow.confidence * 100)}% confidence</Badge>
            <Badge>{flow.actor}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{flow.beginnerExplanation}</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["simple", "technical"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDetailMode(mode)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-bold text-muted-foreground",
                detailMode === mode && "bg-primary text-primary-foreground"
              )}
            >
              {mode === "simple" ? (
                <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {mode === "simple" ? "Simple" : "Technical"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {flow.steps.map((step) => (
          <article key={`${flow.id}-${step.order}`} className="rounded-md border border-border bg-card p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                {step.order}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-black">{step.title}</h4>
                  <Badge>{step.layer}</Badge>
                  <Badge>{step.visualHint}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {detailMode === "simple" ? step.plainEnglish : step.technical}
                </p>
                {detailMode === "technical" && step.filePaths.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {step.filePaths.map((filePath) => (
                      <Badge key={filePath} className="max-w-full truncate">
                        {filePath}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <CheckCircle2 className="hidden h-5 w-5 text-primary sm:block" aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

