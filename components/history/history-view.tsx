"use client";

import { Clock3, Home, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClassName } from "@/components/ui/button";
import { readStoredAnalysisRecord, type StoredAnalysisRecord } from "@/lib/storage/history";

export function HistoryView() {
  const [record, setRecord] = useState<StoredAnalysisRecord | null>(null);

  useEffect(() => {
    setRecord(readStoredAnalysisRecord());
  }, []);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 py-2">
        <Link href="/" className={buttonClassName({ variant: "outline", size: "icon" })} aria-label="Home">
          <Home className="h-4 w-4" aria-hidden="true" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto mt-8 max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Analysis History</h1>
            <p className="mt-1 text-sm text-muted-foreground">Local analysis records.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {record ? (
            <article className="panel rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">Last streamed analysis</h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {record.repoUrl} · {record.mode} · {new Date(record.savedAt).toLocaleString()}
                  </p>
                </div>
                <Link href={`/result/${record.id}`} className={buttonClassName({ variant: "outline", size: "sm" })}>
                  Open
                </Link>
              </div>
            </article>
          ) : (
            <article className="panel rounded-lg p-5">
              <h2 className="font-bold">No saved analysis yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Run a repository scan to create the first local history record.
              </p>
              <Link href="/analyze" className={buttonClassName({ className: "mt-4", size: "sm" })}>
                <Search className="h-4 w-4" aria-hidden="true" />
                Analyze
              </Link>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
