import type { AnalysisStreamEvent } from "@/lib/types/analysis";

export function extractSseBlocks(buffer: string) {
  const blocks = buffer.split("\n\n");
  return {
    completeBlocks: blocks.slice(0, -1),
    remainingBuffer: blocks.at(-1) ?? ""
  };
}

export function parseSseBlock(block: string): AnalysisStreamEvent | null {
  const dataLine = block
    .split("\n")
    .find((line) => line.startsWith("data: "));

  if (!dataLine) {
    return null;
  }

  try {
    return JSON.parse(dataLine.slice(6)) as AnalysisStreamEvent;
  } catch {
    return null;
  }
}

