import type { AnalysisStreamEvent } from "@/lib/types/analysis";

export function encodeSse(event: AnalysisStreamEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

