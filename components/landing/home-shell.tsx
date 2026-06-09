"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Network, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";

const heroNodes = [
  { label: "RepoScout", meta: "tree scan", top: "18%", left: "62%" },
  { label: "ASTMapper", meta: "code facts", top: "44%", left: "73%" },
  { label: "FlowFinder", meta: "user paths", top: "67%", left: "58%" },
  { label: "PromptForge", meta: "build prompts", top: "38%", left: "43%" }
];

const heroEdges = [
  { top: "33%", left: "59%", width: "16%", rotate: "30deg" },
  { top: "58%", left: "61%", width: "16%", rotate: "128deg" },
  { top: "46%", left: "48%", width: "19%", rotate: "6deg" }
];

const metrics = [
  ["337", "selected files"],
  ["947", "skipped safely"],
  ["92%", "context saved"],
  ["AST", "code facts"]
];

export function HomeShell() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUrl = repoUrl.trim()
      ? `/analyze?repo=${encodeURIComponent(repoUrl.trim())}`
      : "/analyze";
    router.push(nextUrl);
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-2">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Network className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>CodeMotion Studio</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/history" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            History
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="relative mx-auto mt-5 flex min-h-[72svh] max-w-7xl items-center overflow-hidden rounded-lg border border-border bg-card px-5 py-10 sm:px-8 lg:px-12">
        <div className="hero-graph absolute inset-0 rounded-lg border-0 opacity-95" aria-hidden="true">
          <div className="scan-beam" />
          {heroEdges.map((edge) => (
            <span
              key={`${edge.top}-${edge.left}`}
              className="hero-edge"
              style={{
                top: edge.top,
                left: edge.left,
                width: edge.width,
                transform: `rotate(${edge.rotate})`
              }}
            />
          ))}
          {heroNodes.map((node) => (
            <motion.div
              key={node.label}
              className="hero-node"
              style={{ top: node.top, left: node.left }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <span className="text-xs font-semibold text-muted-foreground">{node.meta}</span>
              <span className="text-sm font-bold">{node.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Real repo analysis
          </Badge>
          <motion.h1
            className="text-4xl font-black leading-tight sm:text-6xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            CodeMotion Studio
          </motion.h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Animated repo analysis with live pipeline logs, safe context budgets, stack DNA,
            flow previews, prompt generation, and AI-ready component specs.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 flex max-w-2xl flex-col gap-3 rounded-lg border border-border bg-background/92 p-2 sm:flex-row"
          >
            <label className="sr-only" htmlFor="repo-url">
              GitHub repository URL
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                id="repo-url"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/vercel/next.js"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit">
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Analyze
            </Button>
            <Link href="/analyze" className={buttonClassName({ variant: "secondary" })}>
              Console
            </Link>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([value, label]) => (
          <div key={label} className="panel rounded-lg p-4">
            <div className="text-2xl font-black">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto mb-8 grid max-w-7xl gap-3 lg:grid-cols-3">
        {["Streaming analyzer", "Huge repo guardrails", "Safe ComponentSpec UI"].map((title) => (
          <article key={title} className="panel rounded-lg p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {title === "Streaming analyzer"
                ? "The analyzer emits Server-Sent Events while it validates, fetches, plans, parses, and maps code."
                : title === "Huge repo guardrails"
                  ? "The first data model already tracks selected files, skipped files, AST counts, and context saved."
                  : "Generated UI starts from JSON specs and avoids browser eval by design."}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
