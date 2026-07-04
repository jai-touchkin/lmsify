import { useParams } from "react-router-dom";
import { CourseDetail } from "@/features/courses";
import { Header } from "@/components/layout/Header";

/**
 * Public course detail page. Internal paywall (rendered by <CourseDetail>)
 * handles auth + purchase gating — there's no <ProtectedRoute> here, so an
 * unauthenticated user can still see the meta and click "Sign in to enroll".
 */
export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-muted-foreground text-sm">Invalid course id.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <CourseDetail courseId={id} />
      </div>
    </main>
  );
}
