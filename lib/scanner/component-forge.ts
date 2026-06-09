import type { ComponentSpec, DesignDNA } from "@/lib/types/analysis";

export function forgeComponentSpec(input: {
  repoName: string;
  designDNA: DesignDNA;
  primaryFlowName: string;
}): ComponentSpec {
  const colorNote = input.designDNA.colors.slice(0, 4).join(", ");
  const patternNote = input.designDNA.componentPatterns.slice(0, 4).join(", ");

  return {
    name: "AnalysisInsightCard",
    purpose: `Summarize ${input.repoName} with the detected design language and primary ${input.primaryFlowName} flow.`,
    responsive_behavior: "Single column on mobile, compact metric row on tablet and desktop.",
    design_notes: `Uses detected colors (${colorNote}) and component patterns (${patternNote}).`,
    props: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Card title."
      },
      {
        name: "summary",
        type: "string",
        required: true,
        description: "Short repository or flow summary."
      }
    ],
    layout: {
      type: "card",
      className: "rounded-lg border bg-card p-4",
      children: []
    },
    elements: [
      {
        type: "badge",
        content: "Generated from analysis",
        className: "border-primary/30 bg-primary/10 text-primary"
      },
      {
        type: "text",
        content: `${input.repoName} uses ${input.designDNA.visualTone}.`,
        className: "text-sm text-muted-foreground"
      },
      {
        type: "progress",
        content: "86",
        className: "h-2 rounded-full bg-primary"
      },
      {
        type: "button",
        content: "Open analysis",
        className: "bg-primary text-primary-foreground"
      }
    ],
    tsx_code:
      "export function AnalysisInsightCard({ title, summary }: { title: string; summary: string }) {\n  return <section className=\"rounded-lg border bg-card p-4\"><p className=\"text-sm\">{title}</p><p>{summary}</p></section>;\n}",
    tailwind_classes_used: [
      "rounded-lg",
      "border",
      "bg-card",
      "p-4",
      "text-sm",
      "text-muted-foreground",
      "bg-primary"
    ],
    accessibility_notes: [
      "Keep button labels visible at mobile width.",
      "Expose progress values to screen readers when this spec becomes a production component."
    ]
  };
}

