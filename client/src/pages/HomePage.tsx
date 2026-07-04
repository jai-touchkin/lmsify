import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Loader2, LogOut, LogIn, UserPlus } from "lucide-react";

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();

  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="text-primary h-5 w-5" />
          Lmsify
        </div>
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={ROUTES.PROFILE}>
                  {user?.name ?? "Profile"}
                </Link>
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
          ) : (
            <>
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
          )}
          <ThemeToggle />
        </nav>
      </header>

      <Separator />

      <section className="mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              {isAuthenticated
                ? `Welcome back, ${user?.name ?? "friend"}`
                : "Learn anything, one course at a time"}
            </CardTitle>
            <CardDescription>
              {isAuthenticated
                ? "You're signed in. Browse courses, manage your playlist, and pick up where you left off."
                : "Sign in to enroll in courses, track your progress, and build your playlist."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Course browse and player arrive in FE-3.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
