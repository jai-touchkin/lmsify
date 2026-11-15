/**
 * Player feature — single flat file using @vidstack/react. Includes the
 * player component, the lecture sidebar, and resume-progress via localStorage.
 *
 * Same precedent as `auth.tsx` / `courses.tsx` / `payments.tsx`: flat file,
 * suppress Fast Refresh warnings.
 *
 * Scope (FE-5):
 *   - Route `/courses/:id/lectures/:lectureId`
 *   - Vidstack MediaPlayer with the default video layout (controls, poster,
 *     captions menu, keyboard shortcuts)
 *   - Resume position via localStorage (per-device, no BE needed)
 *   - Auto-advance to the next lecture on `ended`
 *
 * Two things this file used to get wrong, both fixed here:
 *   1. It imported only `styles/base.css` and rendered no layout, so the
 *      player had NO visible controls at all.
 *   2. It called `useMediaPlayer()` from the component that *renders*
 *      `<MediaPlayer>`. That hook reads context from an ancestor, so it
 *      always returned null and every effect below it was dead code —
 *      resume, progress saving and auto-advance never ran. The player
 *      instance now comes from a ref on the element itself.
 */
import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { AxiosError } from "axios";
import { ChevronLeft, Lock, SkipBack, SkipForward } from "lucide-react";

import { useCourseLectures, useCourses } from "@/features/courses";
import type { Lecture } from "@/api/schemas";
import { courseDetailPath, lecturePlayerPath } from "@/api/endpoints";
import {
  clearProgress,
  getProgress,
  setLastLecture,
  setProgress,
} from "@/lib/playerStorage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Save at most once every 5 seconds of playback. */
const SAVE_INTERVAL_SECONDS = 5;

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function LectureSidebar({
  courseId,
  lectures,
  currentLectureId,
}: {
  courseId: string;
  lectures: Lecture[];
  currentLectureId: string;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Course content</h2>
        <p className="text-muted-foreground font-mono text-xs">
          {lectures.length} lecture{lectures.length === 1 ? "" : "s"}
        </p>
      </div>
      <ol className="max-h-[28rem] divide-y overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
        {lectures.map((l, idx) => {
          const isCurrent = l.id === currentLectureId;
          const started = (getProgress(l.id) ?? 0) > 0;
          return (
            <li key={l.id}>
              <Link
                to={lecturePlayerPath(courseId, l.id)}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "focus-visible:ring-ring flex items-start gap-3 px-4 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none",
                  isCurrent
                    ? "bg-accent font-medium"
                    : "hover:bg-accent/50 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 font-mono text-xs",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block leading-snug">{l.title}</span>
                </span>
                {started && !isCurrent && (
                  <span
                    className="bg-highlight mt-1.5 size-1.5 shrink-0 rounded-full"
                    title="In progress"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage — the player plus the effects that depend on the player instance
// ---------------------------------------------------------------------------

function LectureStage({
  courseId,
  lectureId,
  lecture,
  poster,
  lectures,
}: {
  courseId: string;
  lectureId: string;
  lecture: Lecture;
  poster?: string;
  lectures: Lecture[];
}) {
  const navigate = useNavigate();
  const playerRef = useRef<MediaPlayerInstance>(null);

  // Written on every time-update so the unmount save doesn't have to read
  // the player (which may already have been torn down by then).
  const latestTime = useRef(0);
  const lastSaved = useRef(0);
  const restored = useRef(false);

  const idx = lectures.findIndex((l) => l.id === lectureId);
  const prev = lectures[idx - 1];
  const next = lectures[idx + 1];

  // Remember this as the course's resume point, and flush the position when
  // the lecture changes or the page unmounts.
  useEffect(() => {
    restored.current = false;
    latestTime.current = 0;
    lastSaved.current = 0;
    setLastLecture(courseId, lectureId);

    return () => {
      if (latestTime.current > 0) setProgress(lectureId, latestTime.current);
    };
  }, [courseId, lectureId]);

  const handleCanPlay = () => {
    const player = playerRef.current;
    if (!player || restored.current) return;
    restored.current = true;
    const saved = getProgress(lectureId);
    if (saved != null && saved > 0) player.currentTime = saved;
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (!player) return;
    const now = player.currentTime;
    latestTime.current = now;
    if (now - lastSaved.current >= SAVE_INTERVAL_SECONDS) {
      lastSaved.current = now;
      setProgress(lectureId, now);
    }
  };

  const handleEnded = () => {
    // Finished — don't resume this one at the very end next time.
    clearProgress(lectureId);
    latestTime.current = 0;
    if (next) navigate(lecturePlayerPath(courseId, next.id));
  };

  return (
    <div className="space-y-6">
      <MediaPlayer
        key={lectureId}
        ref={playerRef}
        title={lecture.title}
        src={lecture.video.url}
        // No `crossOrigin`: videos are served from the public R2 bucket,
        // which sends no `Access-Control-Allow-Origin`. Requesting them in
        // CORS mode makes the browser discard an otherwise-fine 206 response
        // and the player errors out. Plain playback needs no CORS. If
        // cross-origin text tracks or storyboard thumbnails are added later,
        // put a CORS rule on the bucket and restore this attribute.
        playsInline
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="ring-border w-full overflow-hidden rounded-lg bg-black ring-1"
      >
        <MediaProvider>
          {poster && (
            <Poster className="vds-poster" src={poster} alt={lecture.title} />
          )}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>

      <div>
        <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          Lecture {String(idx + 1).padStart(2, "0")} of{" "}
          {String(lectures.length).padStart(2, "0")}
        </p>
        <h1 className="font-display mt-2 text-2xl font-semibold text-balance">
          {lecture.title}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
          {lecture.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        {prev ? (
          <Button asChild variant="outline">
            <Link to={lecturePlayerPath(courseId, prev.id)}>
              <SkipBack className="size-4" />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <SkipBack className="size-4" />
            Previous
          </Button>
        )}

        {next ? (
          <Button asChild>
            <Link to={lecturePlayerPath(courseId, next.id)}>
              Next lecture
              <SkipForward className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to={courseDetailPath(courseId)}>Back to course</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LecturePlayer
// ---------------------------------------------------------------------------

export function LecturePlayer({
  courseId,
  lectureId,
}: {
  courseId: string;
  lectureId: string;
}) {
  // Force-enable: the lectures query is shared with the course detail page.
  // If a student lands on the player directly, we still need the list.
  const {
    data: lectures,
    isLoading,
    isError,
    error,
  } = useCourseLectures(courseId, true);

  // Course meta (title, poster) only exists on the list endpoint.
  const { data: courses } = useCourses({});
  const course = useMemo(
    () => courses?.find((c) => c.id === courseId),
    [courses, courseId],
  );

  const lecture = useMemo(
    () => lectures?.find((l) => l.id === lectureId),
    [lectures, lectureId],
  );

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  // 403 is the expected "hasn't bought it" case — send them to the course
  // page to enrol rather than showing a generic failure.
  if ((error as AxiosError)?.response?.status === 403) {
    return (
      <div className="bg-card mx-auto max-w-md rounded-lg border border-dashed px-6 py-16 text-center">
        <Lock className="text-muted-foreground mx-auto size-6" />
        <h1 className="font-display mt-4 text-2xl font-semibold">
          This lecture is locked
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enrol in the course to watch it.
        </p>
        <Button asChild className="mt-6">
          <Link to={courseDetailPath(courseId)}>View the course</Link>
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load this course</AlertTitle>
        <AlertDescription>
          {(error as AxiosError<{ message?: string }>)?.response?.data
            ?.message ??
            (error as Error)?.message ??
            "Something went wrong."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!lecture) {
    return (
      <div className="bg-card mx-auto max-w-md rounded-lg border border-dashed px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Lecture not found
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          It may have been removed from this course.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to={courseDetailPath(courseId)}>Back to the course</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={courseDetailPath(courseId)}>
            <ChevronLeft className="size-4" />
            {course?.title ?? "Back to course"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <LectureStage
          courseId={courseId}
          lectureId={lectureId}
          lecture={lecture}
          poster={course?.poster.url}
          lectures={lectures ?? []}
        />

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LectureSidebar
            courseId={courseId}
            lectures={lectures ?? []}
            currentLectureId={lectureId}
          />
        </aside>
      </div>
    </div>
  );
}
