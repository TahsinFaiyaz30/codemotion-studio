import { AlertTriangle, Home, Search } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClassName } from "@/components/ui/button";

export function MissingResult({
  analysisId,
  checkedBrowserCache = false
}: {
  analysisId: string;
  checkedBrowserCache?: boolean;
}) {
  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-4xl items-center justify-between py-2">
        <Link href="/" className={buttonClassName({ variant: "outline", size: "icon" })} aria-label="Home">
          <Home className="h-4 w-4" aria-hidden="true" />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto mt-12 max-w-4xl">
        <section className="panel rounded-lg p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-warning text-warning-foreground">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black">Analysis Not Found</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            `{analysisId}` is not in the server-side analysis cache.
            {checkedBrowserCache
              ? " This browser does not have a saved recovery copy either. Run a new scan to create a fresh result."
              : " Checking this browser for a saved recovery copy."}
          </p>
          <Link href="/analyze" className={buttonClassName({ className: "mt-5" })}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Analyze repository
          </Link>
        </section>
      </main>
    </div>
  );
}
