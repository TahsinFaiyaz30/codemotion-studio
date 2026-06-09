import path from "node:path";
import type { CodeNodeKind } from "@/lib/types/analysis";

const binaryExtensions = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "ico",
  "svg",
  "mp4",
  "mov",
  "mp3",
  "wav",
  "woff",
  "woff2",
  "ttf",
  "eot",
  "pdf",
  "zip",
  "gz",
  "tar",
  "wasm"
]);

const sourceExtensions = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "css",
  "scss",
  "sass",
  "md",
  "mdx",
  "prisma",
  "graphql",
  "gql",
  "yml",
  "yaml"
]);

const generatedSegments = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  "vendor",
  "__pycache__"
]);

export function getExtension(filePath: string) {
  const ext = path.posix.extname(filePath).replace(".", "").toLowerCase();
  return ext || path.posix.basename(filePath).toLowerCase();
}

export function normalizeRepoPath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function isSourceLike(filePath: string) {
  return sourceExtensions.has(getExtension(filePath));
}

export function getSkipReason(filePath: string, size: number) {
  const normalized = normalizeRepoPath(filePath);
  const segments = normalized.split("/");
  const extension = getExtension(normalized);

  if (segments.some((segment) => generatedSegments.has(segment))) {
    return "generated_or_dependency_directory";
  }

  if (binaryExtensions.has(extension)) {
    return "binary_or_media_file";
  }

  if (!sourceExtensions.has(extension)) {
    return "unsupported_extension";
  }

  if (/package-lock\.json$|pnpm-lock\.yaml$|yarn\.lock$|bun\.lockb$/i.test(normalized)) {
    return "lockfile";
  }

  if (/\.env($|\.)/i.test(path.posix.basename(normalized))) {
    return "environment_secret_file";
  }

  if (size <= 0) {
    return "empty_file";
  }

  return null;
}

export function scoreFile(filePath: string, size: number) {
  const normalized = normalizeRepoPath(filePath).toLowerCase();
  const basename = path.posix.basename(normalized);
  const extension = getExtension(normalized);
  let score = 10;

  if (["ts", "tsx", "js", "jsx"].includes(extension)) score += 35;
  if (["json", "css", "scss", "prisma", "mdx"].includes(extension)) score += 18;
  if (/^(package|next\.config|vite\.config|tailwind\.config|tsconfig|postcss\.config)/.test(basename)) score += 48;
  if (normalized.includes("/app/") || normalized.startsWith("app/")) score += 38;
  if (normalized.includes("/pages/") || normalized.startsWith("pages/")) score += 34;
  if (normalized.includes("/components/") || normalized.startsWith("components/")) score += 28;
  if (normalized.includes("/lib/") || normalized.startsWith("lib/")) score += 26;
  if (normalized.includes("/api/") || normalized.includes("route.ts")) score += 28;
  if (normalized.includes("auth") || normalized.includes("session")) score += 20;
  if (normalized.includes("db") || normalized.includes("database") || normalized.includes("prisma")) score += 18;
  if (normalized.includes("store") || normalized.includes("hook") || normalized.includes("use-")) score += 12;
  if (/\.(test|spec)\./.test(normalized) || normalized.includes("__tests__")) score -= 18;
  if (normalized.includes("/public/") || normalized.startsWith("public/")) score -= 30;
  if (size > 120_000) score -= 16;
  if (size > 240_000) score -= 32;

  return Math.max(1, score);
}

export function classifyNodeKind(filePath: string): CodeNodeKind {
  const normalized = normalizeRepoPath(filePath).toLowerCase();

  if (normalized.includes("schema.prisma") || normalized.includes("/models/")) return "model";
  if (normalized.includes("/api/") || normalized.endsWith("route.ts") || normalized.endsWith("route.js")) return "api";
  if (normalized.includes("/hooks/") || /use-[\w-]+\.(ts|tsx|js|jsx)$/.test(normalized)) return "hook";
  if (normalized.includes("/components/")) return "component";
  if (normalized.includes("/app/") || normalized.startsWith("app/") || normalized.includes("/pages/")) return "page";
  if (normalized.includes("/services/")) return "service";
  if (normalized.includes("/config") || normalized.includes("config.")) return "config";
  if (normalized.includes("/lib/") || normalized.includes("/utils/")) return "utility";

  return "folder";
}

export function featureGroupForPath(filePath: string) {
  const normalized = normalizeRepoPath(filePath).toLowerCase();
  const rules = [
    ["auth", ["auth", "login", "signin", "signup", "session", "jwt"]],
    ["checkout", ["checkout", "cart", "payment", "stripe", "order"]],
    ["admin", ["admin", "dashboard", "moderation"]],
    ["content", ["post", "blog", "article", "cms", "content"]],
    ["upload", ["upload", "media", "storage", "file"]],
    ["chat", ["chat", "message", "conversation"]],
    ["profile", ["profile", "account", "settings", "user"]],
    ["data", ["prisma", "schema", "model", "database", "db"]]
  ] as const;

  for (const [group, keywords] of rules) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return group;
    }
  }

  if (normalized.includes("component")) return "ui";
  if (normalized.includes("api")) return "api";

  return "core";
}

export function labelFromPath(filePath: string) {
  const basename = path.posix.basename(filePath).replace(/\.(tsx|ts|jsx|js|json|css|scss|mdx|md|prisma)$/i, "");
  return basename
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

