import { AuthCard, RegisterForm } from "@/features/auth";
import { Header } from "@/components/layout/Header";

export function RegisterPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <Header variant="minimal" />

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
