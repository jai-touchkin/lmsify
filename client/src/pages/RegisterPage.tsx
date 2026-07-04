import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AuthCard, RegisterForm } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function RegisterPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6">
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 font-semibold"
        >
          <Sparkles className="text-primary h-5 w-5" />
          Lmsify
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <AuthCard
          title="Create your account"
          description="Start learning in minutes"
        >
          <RegisterForm />
        </AuthCard>
      </div>
    </main>
  );
}
