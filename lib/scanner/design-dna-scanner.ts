import type { DesignDNA, RepoFile } from "@/lib/types/analysis";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, 12);
}

function extractClassTokens(content: string) {
  const matches = Array.from(content.matchAll(/class(?:Name)?=(?:"([^"]+)"|'([^']+)'|{`([^`]+)`})/g));
  return matches
    .flatMap((match) => (match[1] ?? match[2] ?? match[3] ?? "").split(/\s+/))
    .map((token) => token.trim())
    .filter(Boolean);
}

export function scanDesignDNA(files: RepoFile[]): DesignDNA {
  const contents = files.filter((file) => file.selected && file.content).map((file) => file.content ?? "");
  const tokens = contents.flatMap(extractClassTokens);
  const cssText = contents.join("\n");
  const colors = unique([
    ...tokens.filter((token) => /^(bg|text|border|from|to|via)-/.test(token)).slice(0, 60),
    ...Array.from(cssText.matchAll(/#[0-9a-f]{3,8}\b/gi)).map((match) => match[0]).slice(0, 20)
  ]);
  const typography = unique(tokens.filter((token) => /^(text|font|leading)-/.test(token)));
  const spacing = unique(tokens.filter((token) => /^(p|px|py|m|mx|my|gap|space)-/.test(token)));
  const radius = unique(tokens.filter((token) => /^rounded/.test(token)));
  const componentPatterns = unique(
    tokens.filter((token) => /^(shadow|border|grid|flex|items|justify|container|divide)-/.test(token))
  );
  const animationPatterns = unique(
    tokens.filter((token) => /^(transition|animate|duration|ease|hover|motion)-/.test(token))
  );
  const detectedLibraries = unique([
    cssText.includes("next-themes") ? "next-themes" : "",
    cssText.includes("framer-motion") ? "framer-motion" : "",
    cssText.includes("lucide-react") ? "lucide-react" : "",
    cssText.includes("@xyflow/react") ? "@xyflow/react" : "",
    cssText.includes("shadcn") ? "shadcn/ui" : ""
  ]);

  return {
    colors: colors.length ? colors : ["No dominant color tokens detected"],
    typography: typography.length ? typography : ["system typography inferred"],
    spacing: spacing.length ? spacing : ["default spacing inferred"],
    radius: radius.length ? radius : ["default radius inferred"],
    componentPatterns: componentPatterns.length ? componentPatterns : ["standard React component layout"],
    animationPatterns: animationPatterns.length ? animationPatterns : ["minimal transition usage"],
    themeStrategy: cssText.includes("dark:") || cssText.includes("next-themes") ? "dark/light class tokens detected" : "theme strategy not explicit",
    visualTone: tokens.some((token) => token.includes("shadow")) ? "layered product interface" : "functional codebase UI",
    detectedLibraries
  };
}

