import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";

import { ProfileForm } from "@/features/auth";
import { Eyebrow, useOwnedCourses } from "@/features/courses";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProfilePage() {
  useDocumentTitle("Account");
  const { total } = useOwnedCourses();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <Eyebrow>Settings</Eyebrow>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
          Account
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your details and what you've enrolled in.
        </p>
      </header>

      <Card className="mt-10 gap-0 py-0">
        <CardContent className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Your details</h2>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">
            Changes save as soon as you submit.
          </p>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card className="mt-6 gap-0 py-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="border-primary/25 bg-primary/5 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg border">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">
                Enrolled courses
              </h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {total === 0
                  ? "You haven't enrolled in anything yet."
                  : `${total} course${total === 1 ? "" : "s"} on your account, kept for good.`}
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to={total === 0 ? ROUTES.COURSES : ROUTES.LEARNING}>
              {total === 0 ? "Browse courses" : "Go to My learning"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
