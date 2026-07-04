import { AuthCard, LoginForm } from "@/features/auth";
import { Header } from "@/components/layout/Header";

export function LoginPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <Header variant="minimal" />

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <AuthCard
          title="Welcome back"
          description="Sign in to continue learning"
        >
          <LoginForm />
        </AuthCard>
      </div>
    </main>
  );
}
