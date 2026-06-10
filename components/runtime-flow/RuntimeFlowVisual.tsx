"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Database,
  MousePointerClick,
  PanelsTopLeft,
  RadioTower,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { RuntimeFlow, RuntimeFlowStep, VisualActorKind, VisualActorSpec } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

const iconByActorKind: Record<VisualActorKind, typeof MousePointerClick> = {
  person: MousePointerClick,
  app: Sparkles,
  screen: PanelsTopLeft,
  api: RadioTower,
  database: Database,
  service: Sparkles,
  result: CheckCircle2
};

function actorKindForStep(step: RuntimeFlowStep): VisualActorKind {
  if (step.layer === "user") return "person";
  if (step.layer === "screen" || step.layer === "component" || step.layer === "ui-update") return "screen";
  if (step.layer === "database") return "database";
  if (step.layer === "response") return "result";
  if (step.layer === "api" || step.layer === "external") return "api";
  return "service";
}

function actorsFromFlow(flow: RuntimeFlow): VisualActorSpec[] {
  return flow.steps.map((step, index) => ({
    id: `${flow.id}-actor-${index}`,
    label: step.title,
    kind: actorKindForStep(step),
    role: step.plainEnglish,
    color: index === 0 ? "#df6f31" : index === flow.steps.length - 1 ? "#18a46f" : "#0f9f8e",
    iconHint: step.visualHint
  }));
}

function laneLabel(kind: VisualActorKind) {
  if (kind === "person") return "Human need";
  if (kind === "screen" || kind === "app") return "App experience";
  if (kind === "database" || kind === "service" || kind === "api") return "Product logic";
  return "Outcome";
}

export function RuntimeFlowVisual({ flow }: { flow: RuntimeFlow }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const actors = useMemo(
    () => (flow.visualSpec?.nodes?.length ? flow.visualSpec.nodes : actorsFromFlow(flow)),
    [flow]
  );
  const activeActor = actors[activeIndex] ?? actors[0];
  const ActiveIcon = activeActor ? iconByActorKind[activeActor.kind] : Sparkles;

  useEffect(() => {
    setActiveIndex(0);
  }, [flow.id]);

  useEffect(() => {
    if (actors.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % actors.length);
    }, 1900);

    return () => window.clearInterval(timer);
  }, [actors.length]);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="grid border-b border-border lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.55fr)]">
        <div className="p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>Actual App Flow</Badge>
            <Badge>Product journey</Badge>
            <Badge>{Math.round(flow.confidence * 100)}% confidence</Badge>
          </div>
          <h3 className="text-2xl font-black">{flow.plainEnglishName}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{flow.beginnerExplanation}</p>
        </div>
        <div className="border-t border-border bg-card p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-bold uppercase text-muted-foreground">Goal</p>
          <p className="mt-2 text-sm leading-6">{flow.userGoal}</p>
        </div>
      </div>

      <div className="overflow-hidden p-4">
        <div className="mb-4 rounded-lg border border-border bg-card/70 p-4">
          <div className="relative h-10">
            <div className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
            <motion.div
              className="absolute inset-x-4 top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-primary"
              animate={{
                scaleX: activeIndex / Math.max(1, actors.length - 1)
              }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            />
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
              {actors.map((actor, index) => (
                <button
                  key={`rail-${actor.id}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-[11px] font-black transition hover:border-primary",
                    index <= activeIndex && "border-primary bg-primary text-primary-foreground"
                  )}
                  aria-label={`Jump to ${actor.label}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-border bg-card/70 p-4 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.25fr)]">
          <motion.article
            key={activeActor?.id ?? activeIndex}
            className="min-h-80 rounded-lg border border-primary/30 bg-primary/10 p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <motion.span
                className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.25, repeat: Infinity }}
              >
                <ActiveIcon className="h-5 w-5" aria-hidden="true" />
              </motion.span>
              <div>
                <Badge>{activeActor ? laneLabel(activeActor.kind) : "Stage"}</Badge>
                <h4 className="mt-2 text-xl font-black">{activeActor?.label}</h4>
              </div>
            </div>
            <p className="text-sm leading-7">{activeActor?.role}</p>
            {flow.visualSpec?.evidence?.length ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Evidence</p>
                <div className="flex flex-wrap gap-1.5">
                  {flow.visualSpec.evidence.slice(0, 5).map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.article>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actors.map((actor, index) => {
              const Icon = iconByActorKind[actor.kind];
              const isActive = index === activeIndex;

              return (
                <button
                  key={actor.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "min-h-32 rounded-md border border-border bg-background p-3 text-left transition hover:border-primary",
                    isActive && "border-primary bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground"
                      style={{ backgroundColor: actor.color }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {index + 1}/{actors.length}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase text-muted-foreground">
                    {laneLabel(actor.kind)}
                  </p>
                  <p className="mt-1 text-sm font-black leading-5">{actor.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
