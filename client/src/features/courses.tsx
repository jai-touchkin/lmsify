/**
 * Courses feature — single flat file. Co-locates the API calls, TanStack Query
 * hooks, the access helper, and all UI components (CourseCard, CourseGrid,
 * CourseFilterBar, CourseDetail, LectureList, PaywallCard, LecturePlayer stub).
 *
 * Same precedent as `auth.tsx`: no nested folders, suppress Fast Refresh's
 * "only-export-components" warning for the file. Re-split if it grows.
 *
 * Scope (FE-3 read-side):
 *   - GET  /api/v1/courses?keyword=&category=      (public)
 *   - GET  /api/v1/courses/:id                    (auth + access check)
 *
 * Out of scope: purchase flow (FE-4 / Razorpay), the actual video player
 * (FE-3 just opens the lecture's video URL in a new tab).
 */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Eye,
  Filter,
  IndianRupee,
  Lock,
  Play,
  PlayCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/client";
import { ENDPOINTS, ROUTES, courseDetailPath } from "@/api/endpoints";
import {
  type CourseCard,
  type CourseFilter,
  type Lecture,
  type User,
} from "@/api/schemas";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ---------------------------------------------------------------------------
// API layer
// ---------------------------------------------------------------------------

const coursesApi = {
  list: (filter: CourseFilter) =>
    api
      .get<{ success: true; courses: CourseCard[] }>(ENDPOINTS.courses, {
        params: filter,
      })
      .then((r) => r.data.courses),
  lectures: (id: string) =>
    api
      .get<{ success: true; lectures: Lecture[] }>(
        `${ENDPOINTS.courses}/${id}`,
      )
      .then((r) => r.data.lectures),
};

// ---------------------------------------------------------------------------
// Query keys + hooks
// ---------------------------------------------------------------------------

export const courseKeys = {
  all: ["courses"] as const,
  list: (f: CourseFilter) => ["courses", "list", f] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
};

/** Public list of course cards, filterable by keyword + category. */
export function useCourses(filter: CourseFilter) {
  return useQuery({
    queryKey: courseKeys.list(filter),
    queryFn: () => coursesApi.list(filter),
    // Grid is read-mostly; 1-minute staleness keeps refetches cheap when the
    // user toggles between categories rapidly.
    staleTime: 60_000,
  });
}

/**
 * Lectures for a single course. The 403 ("Please purchase this course…") is
 * the expected "not purchased" case — we never retry it, and the detail
 * component renders a paywall on that error.
 */
export function useCourseLectures(id: string, enabled: boolean) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => coursesApi.lectures(id),
    enabled,
    retry: (failureCount, err) => !isForbidden(err) && failureCount < 1,
  });
}

// ---------------------------------------------------------------------------
// Access helper
// ---------------------------------------------------------------------------

const isForbidden = (e: unknown): boolean =>
  (e as AxiosError)?.response?.status === 403;

/**
 * Single source of truth for the three signals a course UI needs:
 *   - isAdmin       — bypasses purchase checks (admins see all lectures)
 *   - isAuthenticated
 *   - isOwned       — id is in `purchasedCourses`
 *
 * `purchasedCourses` is on the full `User` (from `/me`) but NOT on the
 * `UserSummary` returned by `/login` / `/register`. After AuthBootstrap fires
 * `/me`, the store upgrades to the full shape, so by the time the user
 * interacts with a course this is correct.
 */
export function useCourseAccess(courseId: string) {
  const { user, isAuthenticated } = useAuth();
  const purchased = (user as User | null)?.purchasedCourses ?? [];
  return {
    isAdmin: user?.role === "admin",
    isAuthenticated,
    isOwned: purchased.includes(courseId),
  };
}

// ---------------------------------------------------------------------------
// CourseFilterBar
// ---------------------------------------------------------------------------

const TOP_CATEGORIES = 6;

export function CourseFilterBar({
  value,
  onChange,
}: {
  value: CourseFilter;
  onChange: (next: CourseFilter) => void;
}) {
  // Local mirror of the keyword so the input feels instant; debounced value
  // is what propagates to the URL and the query.
  const [keyword, setKeyword] = useState(value.keyword ?? "");
  const debounced = useDebounce(keyword, 250);

  // Parent's `onChange` is a fresh function each render; keep the latest in
  // a ref so the effect doesn't refire (and re-trigger the parent) on every
  // parent render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Push the debounced value up. Only fires when the debounced value changes.
  useEffect(() => {
    if (debounced !== value.keyword) {
      onChangeRef.current({ ...value, keyword: debounced });
    }
  }, [debounced, value]);

  // Categories are derived from the full unfiltered list (callers can pass
  // an extra `categories` prop if they want to avoid an extra fetch; for FE-3
  // we just show common hard-coded ones plus whatever the user has typed).
  const { data: all } = useCourses({});
  const categories = useMemo(() => {
    if (!all) return [] as string[];
    const counts = new Map<string, number>();
    for (const c of all) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_CATEGORIES)
      .map(([cat]) => cat);
  }, [all]);

  const setCategory = (cat: string | undefined) =>
    onChange({ ...value, category: cat });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search courses…"
          className="pl-9"
          aria-label="Search courses"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="text-muted-foreground h-4 w-4 shrink-0" />
        <Button
          variant={!value.category ? "default" : "outline"}
          size="sm"
          onClick={() => setCategory(undefined)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={value.category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
            className="shrink-0"
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CourseCard
// ---------------------------------------------------------------------------

function PriceTag({ price }: { price: number }) {
  if (price === 0) {
    return <span className="text-sm font-semibold">Free</span>;
  }
  return (
    <span className="flex items-center gap-0.5 text-sm font-semibold">
      <IndianRupee className="h-3.5 w-3.5" />
      {price}
    </span>
  );
}

export function CourseCard({ course }: { course: CourseCard }) {
  const { isOwned } = useCourseAccess(course.id);
  return (
    <Link
      to={courseDetailPath(course.id)}
      className="group focus-visible:ring-ring rounded-lg focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="bg-muted relative aspect-video">
          <img
            src={course.poster.url}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {isOwned && (
            <Badge className="absolute top-2 right-2" variant="default">
              <PlayCircle className="h-3 w-3" />
              Enrolled
            </Badge>
          )}
        </div>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">
              {course.title}
            </CardTitle>
            <PriceTag price={course.price} />
          </div>
          <Badge variant="secondary" className="w-fit">
            {course.category}
          </Badge>
          <CardDescription className="text-xs">
            By {course.createdBy}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5" />
              {course.numberOfVideos} lecture
              {course.numberOfVideos === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {course.views.toLocaleString()} views
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// CourseGrid
// ---------------------------------------------------------------------------

function CourseCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function CourseGrid({
  courses,
  isLoading,
  isError,
  error,
  onRetry,
}: {
  courses: CourseCard[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load courses</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {(error as AxiosError<{ message?: string }>)?.response?.data
              ?.message ??
              (error as Error)?.message ??
              "Something went wrong."}
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          No courses match your filters. Try a different keyword or category.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LectureList + LecturePlayer stub
// ---------------------------------------------------------------------------

function LecturePlayer({ lecture }: { lecture: Lecture }) {
  // FE-3 ships the "open in a new tab" stub. A proper player (HTML5 video,
  // progress tracking, etc.) is a later phase.
  return (
    <Button asChild variant="outline" size="sm">
      <a href={lecture.video.url} target="_blank" rel="noreferrer">
        <Play className="h-4 w-4" />
        Play
      </a>
    </Button>
  );
}

export function LectureList({ lectures }: { lectures: Lecture[] }) {
  if (lectures.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center text-sm">
          No lectures yet — check back soon.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lectures</CardTitle>
        <CardDescription>
          {lectures.length} lecture{lectures.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {lectures.map((lec, idx) => (
          <div
            key={lec.id}
            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium">
                Lecture {idx + 1}
              </p>
              <p className="text-sm font-medium">{lec.title}</p>
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {lec.description}
              </p>
            </div>
            <LecturePlayer lecture={lec} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PaywallCard
// ---------------------------------------------------------------------------

export function PaywallCard({ courseId }: { courseId: string }) {
  const { isAuthenticated } = useAuth();
  const next = encodeURIComponent(courseDetailPath(courseId));

  const handleBuy = () => {
    // Placeholder — real Razorpay checkout arrives in FE-4.
    toast.info("Checkout arrives in FE-4");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-4 w-4" />
          Enroll to start watching
        </CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "Purchase this course to unlock all lectures."
            : "Sign in to enroll and track your progress."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <Button onClick={handleBuy}>
            <IndianRupee className="h-4 w-4" />
            Buy now
          </Button>
        ) : (
          <Button asChild>
            <Link to={`${ROUTES.LOGIN}?next=${next}`}>Sign in to enroll</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CourseDetail
// ---------------------------------------------------------------------------

/**
 * Pulls a single course card out of the existing list cache (no extra fetch
 * — the detail endpoint only returns lectures, not the meta). If the list
 * cache doesn't have it (deep-link on first load), the courses query is
 * already in flight from the HomePage / CoursesPage and will populate it
 * shortly; the lectures query (gated on `enabled`) tells us if the id is
 * valid.
 */
function useCourseCard(id: string) {
  const list = useCourses({});
  const cached = useMemo(
    () => list.data?.find((c) => c.id === id),
    [list.data, id],
  );
  return { course: cached, isLoading: list.isLoading };
}

function useHasAccess(courseId: string) {
  const { isAdmin, isAuthenticated, isOwned } = useCourseAccess(courseId);
  return isAdmin || (isAuthenticated && isOwned);
}

export function CourseDetail({ courseId }: { courseId: string }) {
  const { course, isLoading: cardLoading } = useCourseCard(courseId);
  const hasAccess = useHasAccess(courseId);

  const lectures = useCourseLectures(
    courseId,
    Boolean(hasAccess) && Boolean(course),
  );

  if (cardLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course not found</CardTitle>
          <CardDescription>
            We couldn't find a course with that id.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ROUTES.COURSES}>Back to courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg">
        <img
          src={course.poster.url}
          alt={course.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{course.category}</Badge>
          <Badge variant="outline">
            <PlayCircle className="h-3 w-3" />
            {course.numberOfVideos} lectures
          </Badge>
          <Badge variant="outline">
            <Eye className="h-3 w-3" />
            {course.views.toLocaleString()} views
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <p className="text-muted-foreground text-sm">By {course.createdBy}</p>
        <p className="text-sm">{course.description}</p>
        <div className="flex items-center gap-2">
          <PriceTag price={course.price} />
        </div>
      </div>

      <Separator />

      {hasAccess ? (
        lectures.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : lectures.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load lectures</AlertTitle>
            <AlertDescription>
              {(lectures.error as AxiosError<{ message?: string }>)?.response
                ?.data?.message ??
                (lectures.error as Error)?.message ??
                "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : (
          <LectureList lectures={lectures.data ?? []} />
        )
      ) : (
        <PaywallCard courseId={courseId} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeaturedStrip (optional, for HomePage — uses the unfiltered list)
// ---------------------------------------------------------------------------

/**
 * A small horizontal "Featured" strip of up to N course cards. Re-uses the
 * existing `useCourses({})` cache so the Courses page and Home page share
 * one network request.
 */
export function FeaturedCourses({ limit = 4 }: { limit?: number }) {
  const { data, isLoading } = useCourses({});
  const items = useMemo(() => data?.slice(0, limit) ?? [], [data, limit]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (items.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
