import { Link, useParams } from "react-router-dom";

import { LecturePlayer } from "@/features/player";
import { useCourseLectures } from "@/features/courses";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";

/**
 * Watch page for a single lecture. Access is enforced by the API — the
 * lectures endpoint 403s for a course the user hasn't bought, and
 * <LecturePlayer> turns that into an "enrol to watch" panel.
 */
export function LecturePlayerPage() {
  const { id, lectureId } = useParams<{ id: string; lectureId: string }>();

  const { data: lectures } = useCourseLectures(id ?? "", Boolean(id));
  const title = lectures?.find((l) => l.id === lectureId)?.title ?? null;
  useDocumentTitle(title);

  if (!id || !lectureId) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">
          That link isn't valid
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          A lecture link needs both a course and a lecture.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to={ROUTES.COURSES}>Browse courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <LecturePlayer courseId={id} lectureId={lectureId} />
    </div>
  );
}
