import { LogoMark } from "@/components/brand/Logo";

/**
 * Full-viewport loader shown while the session is being restored on boot.
 * Deliberately quiet — it's on screen for a fraction of a second, and a
 * spinner that flashes in and out reads as jitter.
 */
export function PageLoader() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <LogoMark className="text-primary size-8 animate-pulse" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
