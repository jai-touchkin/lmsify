/**
 * Player feature — single flat file using @vidstack/react. Includes the
 * player component, sidebar, and resume-progress via localStorage.
 *
 * Same precedent as `auth.tsx` / `courses.tsx` / `payments.tsx`: flat file,
 * suppress Fast Refresh warnings.
 *
 * Scope (FE-5):
 *   - Dedicated route `/courses/:id/lectures/:lectureId`
 *   - Vidstack MediaPlayer with default layout (poster, play button, controls)
 *   - Resume position via localStorage (per-device, no BE needed)
 *   - Auto-advance to next lecture on `ended`
 *   - Keyboard shortcuts handled by Vidstack (space, arrows, f, m)
 */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  useMediaPlayer,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import { SkipBack, SkipForward } from "lucide-react";

import { useCourseLectures } from "@/features/courses";
import { lecturePlayerPath } from "@/api/endpoints";
import { getProgress, setProgress } from "@/lib/playerStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Components ---------------------------------------------------------

function LectureSidebar({
  courseId,
  lectures,
  currentLectureId,
}: {
  courseId: string;
  lectures: { id: string; title: string }[];
  currentLectureId: string;
}) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {lectures.map((l, idx) => {
          const isCurrent = l.id === currentLectureId;
          return (
            <Link
              key={l.id}
              to={lecturePlayerPath(courseId, l.id)}
              className={`block px-4 py-3 text-sm transition-colors hover:bg-accent ${
                isCurrent ? "bg-accent font-medium" : ""
              }`}
            >
              <span className="text-muted-foreground mr-2 text-xs">
                {idx + 1}.
              </span>
              {l.title}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function LectureContent({
  courseId,
  lectureId,
  lecture,
  lectures,
}: {
  courseId: string;
  lectureId: string;
  lecture: { id: string; title: string; description: string; video: { url: string } };
  lectures: { id: string; title: string }[];
}) {
  const navigate = useNavigate();
  const player = useMediaPlayer();

  // Restore saved position on can-play.
  useEffect(() => {
    if (!player) return;
    const saved = getProgress(lectureId);
    if (saved != null && saved > 0) {
      player.currentTime = saved;
    }
  }, [player, lectureId]);

  // Throttled save during playback (every 5s).
  useEffect(() => {
    if (!player) return;
    let last = 0;
    const onTimeUpdate = () => {
      const now = player.currentTime;
      if (now - last >= 5) {
        setProgress(lectureId, now);
        last = now;
      }
    };
    player.addEventListener("time-update", onTimeUpdate);
    return () => {
      player.removeEventListener("time-update", onTimeUpdate);
      setProgress(lectureId, player.currentTime);
    };
  }, [player, lectureId]);

  // Auto-advance to next lecture on ended.
  useEffect(() => {
    if (!player || !lectures) return;
    const idx = lectures.findIndex((l) => l.id === lectureId);
    const onEnded = () => {
      const next = lectures[idx + 1];
      if (next) {
        navigate(lecturePlayerPath(courseId, next.id));
      }
    };
    player.addEventListener("ended", onEnded);
    return () => player.removeEventListener("ended", onEnded);
  }, [player, lectures, lectureId, courseId, navigate]);

  const idx = lectures.findIndex((l) => l.id === lectureId);
  const prev = lectures[idx - 1];
  const next = lectures[idx + 1];

  return (
    <>
      <MediaPlayer
        title={lecture.title}
        src={lecture.video.url}
        crossOrigin
        playsInline
        className="bg-black aspect-video w-full overflow-hidden rounded-lg"
      >
        <MediaProvider />
        <Poster className="vds-poster" />
      </MediaPlayer>

      <div>
        <h1 className="text-xl font-semibold">{lecture.title}</h1>
        <p className="text-muted-foreground text-sm">{lecture.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline" disabled={!prev}>
          <Link to={prev ? lecturePlayerPath(courseId, prev.id) : "#"}>
            <SkipBack className="h-4 w-4" /> Previous
          </Link>
        </Button>
        <Button asChild variant="outline" disabled={!next}>
          <Link to={next ? lecturePlayerPath(courseId, next.id) : "#"}>
            Next <SkipForward className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </>
  );
}

export function LecturePlayer({
  courseId,
  lectureId,
}: {
  courseId: string;
  lectureId: string;
}) {
  // Force-enable: the lectures query is shared with course detail page.
  // If user lands on player directly, we still need the list.
  const { data: lectures, isLoading, isError, error } = useCourseLectures(courseId, true);
  const lecture = useMemo(
    () => lectures?.find((l) => l.id === lectureId),
    [lectures, lectureId],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  if (isError || !lecture) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load lecture</AlertTitle>
        <AlertDescription>
          {(error as Error)?.message ?? "Lecture not found."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <LectureContent
          courseId={courseId}
          lectureId={lectureId}
          lecture={lecture}
          lectures={lectures ?? []}
        />
      </div>

      <aside>
        <h2 className="mb-2 text-sm font-semibold">Lectures</h2>
        {lectures && (
          <LectureSidebar
            courseId={courseId}
            lectures={lectures}
            currentLectureId={lectureId}
          />
        )}
      </aside>
    </div>
  );
}