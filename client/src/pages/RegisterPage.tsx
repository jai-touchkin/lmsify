import { AuthCard, RegisterForm } from "@/features/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function RegisterPage() {
  useDocumentTitle("Create an account");

  return (
    <AuthCard
      title="Create your account"
      description="Free to make. You only pay when you enrol in a course."
    >
      <RegisterForm />
    </AuthCard>
  );
}
