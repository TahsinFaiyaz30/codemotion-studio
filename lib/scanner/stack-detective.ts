import type { AnalysisResult, ParsedFileAst, RepoFile } from "@/lib/types/analysis";

type StackItem = AnalysisResult["stack"][number];

const packageSignals: Array<{
  dependency: string;
  name: string;
  signal: string;
  confidence: number;
}> = [
  { dependency: "next", name: "Next.js", signal: "next dependency in package.json", confidence: 94 },
  { dependency: "react", name: "React", signal: "react dependency in package.json", confidence: 92 },
  { dependency: "tailwindcss", name: "Tailwind CSS", signal: "tailwindcss dependency in package.json", confidence: 90 },
  { dependency: "@prisma/client", name: "Prisma", signal: "@prisma/client dependency in package.json", confidence: 88 },
  { dependency: "mongoose", name: "Mongoose", signal: "mongoose dependency in package.json", confidence: 86 },
  { dependency: "drizzle-orm", name: "Drizzle ORM", signal: "drizzle-orm dependency in package.json", confidence: 86 },
  { dependency: "next-auth", name: "NextAuth", signal: "next-auth dependency in package.json", confidence: 86 },
  { dependency: "@clerk/nextjs", name: "Clerk", signal: "@clerk/nextjs dependency in package.json", confidence: 86 },
  { dependency: "stripe", name: "Stripe", signal: "stripe dependency in package.json", confidence: 84 },
  { dependency: "framer-motion", name: "Framer Motion", signal: "framer-motion dependency in package.json", confidence: 82 },
  { dependency: "lucide-react", name: "lucide-react", signal: "lucide-react dependency in package.json", confidence: 80 },
  { dependency: "@xyflow/react", name: "React Flow", signal: "@xyflow/react dependency in package.json", confidence: 80 },
  { dependency: "zod", name: "Zod", signal: "zod dependency in package.json", confidence: 78 }
];

function readPackageJson(files: RepoFile[]) {
  const packageFile = files.find((file) => file.path.endsWith("package.json") && file.content);

  if (!packageFile?.content) {
    return {};
  }

  try {
    const pkg = JSON.parse(packageFile.content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };
  } catch {
    return {};
  }
}

export function detectStack(files: RepoFile[], parsedFiles: ParsedFileAst[]): StackItem[] {
  const dependencies = readPackageJson(files);
  const stack = new Map<string, StackItem>();

  for (const signal of packageSignals) {
    if (dependencies[signal.dependency]) {
      stack.set(signal.name, {
        name: signal.name,
        signal: `${signal.signal} (${dependencies[signal.dependency]})`,
        confidence: signal.confidence
      });
    }
  }

  if (files.some((file) => file.path.startsWith("app/"))) {
    stack.set("Next.js App Router", {
      name: "Next.js App Router",
      signal: "app/ directory detected",
      confidence: 91
    });
  }

  if (files.some((file) => /tailwind\.config|globals\.css|app\/globals\.css/.test(file.path))) {
    stack.set("Tailwind or utility CSS", {
      name: "Tailwind or utility CSS",
      signal: "Tailwind config or utility-heavy global CSS detected",
      confidence: 76
    });
  }

  if (parsedFiles.some((file) => file.authSignals.length)) {
    stack.set("Auth layer", {
      name: "Auth layer",
      signal: "auth/session/JWT symbols detected in code",
      confidence: 72
    });
  }

  if (parsedFiles.some((file) => file.dbSignals.length)) {
    stack.set("Database layer", {
      name: "Database layer",
      signal: "database client symbols detected in code",
      confidence: 72
    });
  }

  if (!stack.size) {
    stack.set("Source code", {
      name: "Source code",
      signal: "source files were selected and parsed",
      confidence: 50
    });
  }

  return Array.from(stack.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

