"use client";

import { Check, Copy, Monitor, RefreshCcw, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComponentSpec } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

const previewModes = [
  { id: "mobile", label: "Mobile", icon: Smartphone, className: "preview-mobile" },
  { id: "tablet", label: "Tablet", icon: Tablet, className: "preview-tablet" },
  { id: "desktop", label: "Desktop", icon: Monitor, className: "preview-desktop" }
] as const;

function renderSpecElement(element: ComponentSpec["elements"][number], index: number) {
  if (element.type === "badge") {
    return <Badge key={index}>{element.content}</Badge>;
  }

  if (element.type === "button") {
    return (
      <button key={index} type="button" className="h-9 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground">
        {element.content}
      </button>
    );
  }

  if (element.type === "progress") {
    const value = Number(element.content) || 0;

    return (
      <div key={index} className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Repo score</span>
          <span>{value}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
        </div>
      </div>
    );
  }

  return (
    <p key={index} className="text-sm leading-6 text-muted-foreground">
      {element.content}
    </p>
  );
}

export function ComponentForgePreview({ spec }: { spec: ComponentSpec }) {
  const [mode, setMode] = useState<(typeof previewModes)[number]["id"]>("desktop");
  const [copied, setCopied] = useState<"tsx" | "prompt" | null>(null);
  const activeMode = previewModes.find((item) => item.id === mode) ?? previewModes[2];

  async function copyText(kind: "tsx" | "prompt") {
    const text =
      kind === "tsx"
        ? spec.tsx_code ?? ""
        : `Generate ${spec.name}. Purpose: ${spec.purpose}. Style: ${spec.design_notes}`;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">ComponentForge</h2>
          <p className="mt-1 text-sm text-muted-foreground">{spec.purpose}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => copyText("tsx")}>
            {copied === "tsx" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            TSX
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyText("prompt")}>
            {copied === "prompt" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            Prompt
          </Button>
          <Button variant="secondary" size="sm">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Regenerate
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {previewModes.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-bold",
                mode === item.id && "border-primary bg-primary/10"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className={cn("mx-auto rounded-lg border border-border bg-background p-3 transition-all", activeMode.className)}>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black">{spec.name}</h3>
            <Badge>Safe JSON</Badge>
          </div>
          <div className="space-y-4">{spec.elements.map(renderSpecElement)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Design DNA used</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{spec.design_notes}</p>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Responsive behavior</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{spec.responsive_behavior}</p>
        </div>
      </div>
    </section>
  );
}

