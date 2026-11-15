import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle } from "lucide-react";

import { Eyebrow, useOwnedCourses } from "@/features/courses";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getLastLecture } from "@/lib/playerStorage";
import { ROUTES, courseDetailPath, lecturePlayerPath } from "@/api/endpoints";
import type { CourseCard } from "@/api/schemas";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Highlighter } from "@/components/brand/Highlighter";

/**
 * The student's own shelf. Everything here comes from caches that are already
 * mounted — `purchasedCourses` on the `/me` user, resolved against the shared
 * course list — so the page costs no extra requests.
 */
export function LearningPage() {
  useDocumentTitle("My learning");
  const { courses, isLoading, total } = useOwnedCourses();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <Eyebrow>Your shelf</Eyebrow>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
          My learning
        </h1>
        {total > 0 && (
          <p className="text-muted-foreground mt-2 text-sm">
            {total} course{total === 1 ? "" : "s"} on your account.
          </p>
        )}
      </header>

      <div className="mt-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.max(Math.min(total, 3), 1) }).map(
              (_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-lg" />
              ),
            )}
          </div>
        ) : courses.length === 0 ? (
          <EmptyShelf />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EnrolledCourseCard({ course }: { course: CourseCard }) {
  const lastLectureId = getLastLecture(course.id);

  return (
    <article className="bg-card flex h-full flex-col overflow-hidden rounded-lg border">
      <Link
        to={courseDetailPath(course.id)}
        className="focus-visible:ring-ring group block focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
      >
        <div className="bg-muted relative aspect-video overflow-hidden">
          <img
            src={course.poster.url}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Eyebrow>{course.category}</Eyebrow>
        <h2 className="font-display mt-2 line-clamp-2 text-lg leading-snug font-semibold">
          <Link
            to={courseDetailPath(course.id)}
            className="hover:text-primary transition-colors"
          >
            {course.title}
          </Link>
        </h2>
        <p className="text-muted-foreground mt-1.5 font-mono text-xs">
          {course.numberOfVideos} lecture
          {course.numberOfVideos === 1 ? "" : "s"}
        </p>

        <div className="mt-auto pt-5">
          {lastLectureId ? (
            <Button asChild className="w-full">
              <Link to={lecturePlayerPath(course.id, lastLectureId)}>
                <PlayCircle className="size-4" />
                Resume
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to={courseDetailPath(course.id)}>
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyShelf() {
  return (
    <div className="bg-card rounded-xl border border-dashed px-6 py-20 text-center">
      <h2 className="font-display text-2xl font-semibold text-balance">
        Nothing on the shelf <Highlighter>just yet</Highlighter>.
      </h2>
      <p className="text-muted-foreground mx-auto mt-4 max-w-sm text-sm leading-relaxed">
        Courses you enrol in show up here, each one ready to resume at the
        lecture you last watched.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link to={ROUTES.COURSES}>
          Browse the catalog
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
