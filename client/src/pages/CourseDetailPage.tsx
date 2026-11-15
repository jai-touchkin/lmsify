import { Link, useParams } from "react-router-dom";

import { CourseDetail, useCourses } from "@/features/courses";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";

/**
 * Public course detail page. The internal paywall (rendered by
 * <CourseDetail>) handles auth + purchase gating — there's no
 * <ProtectedRoute> here, so a signed-out visitor can still read the meta and
 * click through to sign in.
 */
export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Title comes from the shared list cache — the detail endpoint returns
  // lectures only, never course metadata.
  const { data } = useCourses({});
  useDocumentTitle(data?.find((c) => c.id === id)?.title ?? null);

  if (!id) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">
          That course link isn't valid
        </h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to={ROUTES.COURSES}>Browse courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <CourseDetail courseId={id} />
    </div>
  );
}
