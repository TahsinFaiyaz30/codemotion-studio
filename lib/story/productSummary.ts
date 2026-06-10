import type { AppUnderstanding } from "@/lib/types/analysis";

export function buildProductSummary(appUnderstanding: AppUnderstanding) {
  const audience = appUnderstanding.audience.length
    ? appUnderstanding.audience.join(", ")
    : "its users";

  return `${appUnderstanding.appName} is a ${appUnderstanding.appType} for ${audience}. ${appUnderstanding.solution} The main problem it solves: ${appUnderstanding.realWorldProblem} Outcome: ${appUnderstanding.primaryOutcome}.`;
}

export function cleanDisplaySummary(summary: string) {
  return summary
    .replace(/\*\*/g, "")
    .replace(/\|[-:\s|]+\|/g, " ")
    .replace(/[|#`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}
