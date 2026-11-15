import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The signature: a marker sweep drawn behind a phrase, the way a student
 * marks up a textbook.
 *
 * The path is deliberately uneven — a hand doesn't draw a rectangle. The
 * viewBox stretches to whatever it wraps (`preserveAspectRatio="none"`), and
 * the stroke is drawn on load via `stroke-dashoffset` (see `.hl-sweep` in
 * `index.css`, which also disables the animation under reduced motion).
 *
 * Used in exactly two places: the landing hero and the empty state on My
 * Learning. Everything else stays quiet.
 */
export function Highlighter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block", className)}>
      <svg
        viewBox="0 0 320 44"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-0.14em] top-[0.14em] bottom-[0.02em] h-[calc(100%-0.16em)] w-[calc(100%+0.28em)]"
      >
        <path
          className="hl-sweep"
          d="M14 29C64 21 118 33 172 25.5 214 19.6 262 21 306 27"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
