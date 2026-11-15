import { AuthCard, LoginForm } from "@/features/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function LoginPage() {
  useDocumentTitle("Sign in");

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to pick up where you stopped."
    >
      <LoginForm />
    </AuthCard>
  );
}
