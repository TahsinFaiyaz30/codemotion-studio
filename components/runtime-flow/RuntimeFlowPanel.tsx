"use client";

import { Route } from "lucide-react";
import { useState } from "react";
import { RuntimeFlowVisual } from "@/components/runtime-flow/RuntimeFlowVisual";
import { Badge } from "@/components/ui/badge";
import type { RuntimeFlow } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

export function RuntimeFlowPanel({ runtimeFlows }: { runtimeFlows: RuntimeFlow[] }) {
  const [activeFlowId, setActiveFlowId] = useState(runtimeFlows[0]?.id ?? "");
  const activeFlow = runtimeFlows.find((flow) => flow.id === activeFlowId) ?? runtimeFlows[0];

  if (!activeFlow) {
    return (
      <section className="panel rounded-lg p-5">
        <h2 className="font-black">Actual App Flow</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No runtime flow could be synthesized from this analysis.
        </p>
      </section>
    );
  }

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Route className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Actual App Flow</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Product view: user action, screen, component, API, database, response, and UI result.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-2 lg:grid-cols-3">
        {runtimeFlows.map((flow) => (
          <button
            key={flow.id}
            type="button"
            onClick={() => setActiveFlowId(flow.id)}
            className={cn(
              "rounded-md border border-border bg-background p-3 text-left transition hover:border-primary",
              activeFlow.id === flow.id && "border-primary bg-primary/10"
            )}
          >
            <span className="block font-black">{flow.plainEnglishName}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{flow.userGoal}</span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              <Badge>{flow.actor}</Badge>
              <Badge>{flow.steps.length} steps</Badge>
            </span>
          </button>
        ))}
      </div>

      <RuntimeFlowVisual flow={activeFlow} />
    </section>
  );
}
