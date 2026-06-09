"use client";

import { AlertTriangle, Bot, CheckCircle2, CircleDot, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisStreamEvent } from "@/lib/types/analysis";

function iconFor(event: AnalysisStreamEvent, isLatest: boolean) {
  if (event.type === "warning") {
    return <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />;
  }

  if (event.type === "ai_activity" || event.type === "component_generation") {
    return <Bot className="h-4 w-4 text-primary" aria-hidden="true" />;
  }

  if (event.type === "final") {
    return <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />;
  }

  if (isLatest) {
    return <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />;
  }

  return <CircleDot className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

export function StreamTimeline({ events }: { events: AnalysisStreamEvent[] }) {
  const latestIndex = events.length - 1;

  if (!events.length) {
    return (
      <div className="panel grid min-h-[320px] place-items-center rounded-lg p-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-muted">
            <Loader2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="font-semibold">Analyzer stream is idle</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a repository or manual-file scan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel rounded-lg p-2">
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${events[latestIndex]?.progress ?? 0}%` }}
        />
      </div>
      <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
        {events.map((event, index) => {
          const isLatest = index === latestIndex;

          return (
            <div
              key={`${event.stage}-${index}`}
              className="stream-row rounded-lg p-3"
              data-active={isLatest}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{iconFor(event, isLatest)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{event.message}</p>
                    <Badge>{event.progress}%</Badge>
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{event.stage}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
