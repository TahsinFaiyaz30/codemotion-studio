"use client";

import { motion } from "framer-motion";
import { Film, StepForward } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FlowScenario } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

export function FlowTheater({ flow }: { flow: FlowScenario }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % flow.steps.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [flow.steps.length]);

  function nextStep() {
    setActiveStep((current) => (current + 1) % flow.steps.length);
  }

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Film className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="font-bold">Flow Theater</h2>
          </div>
          <p className="text-sm text-muted-foreground">{flow.summary}</p>
        </div>
        <Button variant="outline" size="sm" onClick={nextStep}>
          <StepForward className="h-4 w-4" aria-hidden="true" />
          Step
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {flow.steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(index)}
            className={cn(
              "relative min-h-40 rounded-md border border-border bg-background p-3 text-left transition",
              activeStep === index && "border-primary bg-primary/10"
            )}
          >
            {activeStep === index ? (
              <motion.span
                className="flow-packet absolute right-3 top-3 h-3 w-3 rounded-full bg-primary"
                layoutId="flow-packet"
              />
            ) : null}
            <span className="text-xs font-bold uppercase text-muted-foreground">{step.role}</span>
            <span className="mt-2 block font-black">{step.label}</span>
            <span className="mt-2 block text-xs leading-5 text-muted-foreground">{step.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

