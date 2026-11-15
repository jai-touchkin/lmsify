import { Link } from "react-router-dom";
import { ROUTES } from "@/api/endpoints";
import { cn } from "@/lib/utils";

/**
 * The mark: a book with a marigold ribbon bookmark. The ribbon is the same
 * highlight token as the hero sweep, so the two read as one identity.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <path
        d="M5 3.75A1.75 1.75 0 0 1 6.75 2h11.5A1.75 1.75 0 0 1 20 3.75v16.5A1.75 1.75 0 0 1 18.25 22H6.75A1.75 1.75 0 0 1 5 20.25V3.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.4 2.6v18.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity="0.4"
      />
      <path
        d="M12.6 2h3.9v9.1l-1.95-1.65L12.6 11.1V2Z"
        fill="var(--color-highlight)"
      />
    </svg>
  );
}

/** Mark + wordmark, linking home. Used in the header and the footer. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link
      to={ROUTES.HOME}
      className={cn(
        "text-foreground focus-visible:ring-ring flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <LogoMark className={cn("text-primary", markClassName)} />
      <span className="font-display text-lg leading-none font-semibold tracking-tight">
        Lmsify
      </span>
    </Link>
  );
}
