import { Link } from "react-router-dom";
import { FeaturedCourses } from "@/features/courses";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <main className="bg-background text-foreground min-h-screen">
      <Header />

      <Separator />

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              {isAuthenticated
                ? `Welcome back, ${user?.name ?? "friend"}`
                : "Learn anything, one course at a time"}
            </CardTitle>
            <CardDescription>
              {isAuthenticated
                ? "Pick up where you left off, or explore something new."
                : "Sign in to enroll in courses, track your progress, and build your playlist."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={ROUTES.COURSES}>Browse courses</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Featured</h2>
          <FeaturedCourses limit={4} />
        </div>
      </section>
    </main>
  );
}
