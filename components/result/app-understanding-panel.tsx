import { Bot, BrainCircuit, Target, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/types/analysis";

export function AppUnderstandingPanel({ analysis }: { analysis: AnalysisResult }) {
  const understanding = analysis.appUnderstanding;

  if (!understanding) {
    return null;
  }

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BrainCircuit className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{understanding.appType}</Badge>
              <Badge>{Math.round(understanding.confidence * 100)}% understood</Badge>
              <Badge>{analysis.aiProviderChoice ?? "auto"} routing</Badge>
            </div>
            <h2 className="text-xl font-black">{understanding.appName}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{understanding.solution}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            Problem
          </div>
          <p className="text-sm leading-6">{understanding.realWorldProblem}</p>
        </article>
        <article className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
            Audience
          </div>
          <p className="text-sm leading-6">{understanding.audience.join(", ")}</p>
        </article>
        <article className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            Model Agents
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(analysis.aiModelPlan ?? []).slice(0, 5).map((item) => (
              <Badge key={`${item.task}-${item.provider}`}>{`${item.task}: ${item.provider}`}</Badge>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
