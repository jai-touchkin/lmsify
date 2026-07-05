import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { LecturePlayer } from "@/features/player";
import { courseDetailPath } from "@/api/endpoints";
import { Button } from "@/components/ui/button";

export function LecturePlayerPage() {
  const { id, lectureId } = useParams<{ id: string; lectureId: string }>();

  if (!id || !lectureId) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-muted-foreground text-sm">Invalid URL.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to={courseDetailPath(id)}>← Back to course</Link>
          </Button>
        </div>
        <LecturePlayer courseId={id} lectureId={lectureId} />
      </div>
    </main>
  );
}