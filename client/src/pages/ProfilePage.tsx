import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ProfileForm } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ProfilePage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <header className="flex items-center justify-between p-6">
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 font-semibold"
        >
          <Sparkles className="text-primary h-5 w-5" />
          Lmsify
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.HOME}>Home</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>
              Update your name and email. Changes save immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
