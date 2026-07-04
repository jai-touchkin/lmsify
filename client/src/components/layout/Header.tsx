import { Link } from "react-router-dom";
import { Loader2, LogIn, LogOut, Sparkles, UserPlus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * App-wide header. Reads auth state from the store directly (no props) so
 * pages don't need to thread anything through. Authed users see Profile +
 * Sign out; everyone else sees Sign in + Sign up. The Lmsify wordmark links
 * home on every page.
 *
 * Pages that want a more minimal header (Login / Register — just the
 * wordmark + theme toggle) pass `variant="minimal"`.
 */
export function Header({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();

  return (
    <header className="flex items-center justify-between p-6">
      <Link
        to={ROUTES.HOME}
        className="flex items-center gap-2 font-semibold"
      >
        <Sparkles className="text-primary h-5 w-5" />
        Lmsify
      </Link>

      <div className="flex items-center gap-2">
        {variant === "full" && isAuthenticated ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.HOME}>Home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.PROFILE}>{user?.name ?? "Profile"}</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate(undefined)}
              disabled={logout.isPending}
            >
              {logout.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </Button>
          </>
        ) : variant === "full" ? (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.COURSES}>Browse</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={ROUTES.LOGIN}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to={ROUTES.REGISTER}>
                <UserPlus className="h-4 w-4" />
                Sign up
              </Link>
            </Button>
          </>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
