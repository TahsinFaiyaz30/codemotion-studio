"use client";

import type { AnalysisMode } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

const modes: Array<{
  value: AnalysisMode;
  label: string;
  detail: string;
}> = [
  { value: "fast", label: "Fast", detail: "Lean scan" },
  { value: "balanced", label: "Balanced", detail: "Default scan" },
  { value: "deep", label: "Deep", detail: "More AST facts" },
  { value: "huge", label: "Huge", detail: "Strict budgets" }
];

export function ModeSelector({
  value,
  onChange
}: {
  value: AnalysisMode;
  onChange: (value: AnalysisMode) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {modes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={cn(
            "rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary",
            value === mode.value && "border-primary bg-primary/10"
          )}
        >
          <span className="block text-sm font-bold">{mode.label}</span>
          <span className="text-xs text-muted-foreground">{mode.detail}</span>
        </button>
      ))}
    </div>
  );
}
