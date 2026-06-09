import { Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/types/analysis";

export function StackDnaPanel({ analysis }: { analysis: AnalysisResult }) {
  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Layers3 className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-bold">Stack DNA</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {analysis.stack.map((item) => (
          <article key={item.name} className="rounded-md border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold">{item.name}</h3>
              <Badge>{item.confidence}%</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.signal}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

