"use client";

import { BookOpen, GitBranch, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResultMode = "graph" | "runtime" | "story";

const modes: Array<{
  id: ResultMode;
  label: string;
  description: string;
  icon: typeof GitBranch;
}> = [
  {
    id: "graph",
    label: "Graph Mode",
    description: "Developer view: files, imports, APIs, models.",
    icon: GitBranch
  },
  {
    id: "runtime",
    label: "Actual App Flow",
    description: "Product view: user action, UI, backend, database, result.",
    icon: Route
  },
  {
    id: "story",
    label: "Story Mode",
    description: "Normal-person view: what the app is and why it exists.",
    icon: BookOpen
  }
];

export function ResultTabs({
  activeMode,
  onChange
}: {
  activeMode: ResultMode;
  onChange: (mode: ResultMode) => void;
}) {
  return (
    <section className="grid gap-2 md:grid-cols-3" aria-label="Result modes">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              "rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary",
              active && "border-primary bg-primary/10"
            )}
          >
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="block font-black">{mode.label}</span>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">
              {mode.description}
            </span>
          </button>
        );
      })}
    </section>
  );
}

