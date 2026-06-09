"use client";

import { Check, Copy, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PromptCard } from "@/lib/types/analysis";

export function PromptMaker({ prompts }: { prompts: PromptCard[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyPrompt(prompt: PromptCard) {
    await navigator.clipboard.writeText(prompt.body);
    setCopiedId(prompt.id);
    window.setTimeout(() => setCopiedId(null), 1200);
  }

  return (
    <section className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <WandSparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-bold">Prompt Maker</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {prompts.map((prompt) => (
          <article key={prompt.id} className="rounded-md border border-border bg-background p-4">
            <h3 className="font-bold">{prompt.title}</h3>
            <p className="mt-2 min-h-24 text-sm leading-6 text-muted-foreground">{prompt.body}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => copyPrompt(prompt)}
            >
              {copiedId === prompt.id ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              Copy
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

