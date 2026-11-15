import { Link } from "react-router-dom";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

/**
 * The catch-all sits outside the layout routes, so it carries its own
 * minimal chrome — a wordmark to get back out and nothing else.
 */
export function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="p-6">
        <Logo />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <p className="text-muted-foreground font-mono text-sm tracking-[0.18em]">
          404
        </p>
        <h1 className="font-display mt-4 text-3xl font-semibold text-balance sm:text-4xl">
          This page isn't here
        </h1>
        <p className="text-muted-foreground mt-3 max-w-sm text-pretty">
          The link may be out of date, or the course it pointed at was removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to={ROUTES.COURSES}>Browse courses</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.HOME}>Back home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
