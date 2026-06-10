"use client";

import { Bot } from "lucide-react";
import type { AiProviderChoice } from "@/lib/types/analysis";

const providers: Array<{
  value: AiProviderChoice;
  label: string;
  detail: string;
}> = [
  {
    value: "auto",
    label: "Auto",
    detail: "Route each task to the best configured model."
  },
  {
    value: "openai",
    label: "OpenAI",
    detail: "Use only your OpenAI model settings."
  },
  {
    value: "gemini",
    label: "Gemini",
    detail: "Use only your Gemini model settings."
  },
  {
    value: "groq",
    label: "Groq",
    detail: "Use only your Groq model settings."
  },
  {
    value: "local",
    label: "Local",
    detail: "No AI calls; deterministic analysis only."
  }
];

export function ProviderSelector({
  value,
  onChange
}: {
  value: AiProviderChoice;
  onChange: (value: AiProviderChoice) => void;
}) {
  const activeProvider = providers.find((provider) => provider.value === value) ?? providers[0];

  return (
    <div>
      <label htmlFor="ai-provider" className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Bot className="h-4 w-4" aria-hidden="true" />
        AI routing
      </label>
      <select
        id="ai-provider"
        value={value}
        onChange={(event) => onChange(event.target.value as AiProviderChoice)}
        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
      >
        {providers.map((provider) => (
          <option key={provider.value} value={provider.value}>
            {provider.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{activeProvider.detail}</p>
    </div>
  );
}
