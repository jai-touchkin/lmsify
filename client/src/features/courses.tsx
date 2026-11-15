/**
 * Courses feature — single flat file. Co-locates the API calls, TanStack Query
 * hooks, the access helper, and all UI components (CourseCard, CourseGrid,
 * CourseFilterBar, CourseDetail, LectureList, PaywallCard).
 *
 * Same precedent as `auth.tsx`: no nested folders, suppress Fast Refresh's
 * "only-export-components" warning for the file. Re-split if it grows.
 *
 * Scope (FE-3 read-side):
 *   - GET  /api/v1/courses?keyword=&category=      (public)
 *   - GET  /api/v1/courses/:id                    (auth + access check)
 *
 * Note on `views`: the server never increments it, so it is always 0. No UI
 * here reads it — a "0 views" line on every card is worse than no line.
 */
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  BadgeCheck,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  PlayCircle,
  Search,
  Smartphone,
} from "lucide-react";

import { api } from "@/api/client";
import {
  ENDPOINTS,
  ROUTES,
  courseDetailPath,
  lecturePlayerPath,
} from "@/api/endpoints";
import {
  type CourseCard,
  type CourseFilter,
  type Lecture,
  type User,
} from "@/api/schemas";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { getLastLecture, getProgress } from "@/lib/playerStorage";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "@/features/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
      .get<{ success: true; lectures: Lecture[] }>(`${ENDPOINTS.courses}/${id}`)
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

/**
 * The most common categories in the catalog, most-used first. Derived from
 * the shared unfiltered list cache, so callers pay no extra request. Used by
 * the filter bar, the footer, and the landing page's category section.
 */
export function useCourseCategories(limit = 6) {
  const { data } = useCourses({});
  return useMemo(() => {
    if (!data) return [] as string[];
    const counts = new Map<string, number>();
    for (const c of data) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category]) => category);
  }, [data, limit]);
}

/** The signed-in user's purchased courses, resolved against the list cache. */
export function useOwnedCourses() {
  const { user } = useAuth();
  const { data, isLoading } = useCourses({});
  const owned = (user as User | null)?.purchasedCourses ?? [];
  // `purchasedCourses` is a fresh array on every /me refetch, so memoise on
  // its contents rather than its identity.
  const ownedKey = owned.join(",");

  const courses = useMemo(() => {
    if (!data || !ownedKey) return [] as CourseCard[];
    const ids = new Set(ownedKey.split(","));
    return data.filter((c) => ids.has(c.id));
  }, [data, ownedKey]);

  return { courses, isLoading, total: owned.length };
}

// ---------------------------------------------------------------------------
// Access helper
// ---------------------------------------------------------------------------

const isForbidden = (e: unknown): boolean =>
  (e as AxiosError)?.response?.status === 403;

const errorMessage = (e: unknown, fallback: string): string =>
  (e as AxiosError<{ message?: string }>)?.response?.data?.message ??
  (e as Error)?.message ??
  fallback;

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
// Small shared bits
// ---------------------------------------------------------------------------

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function PriceTag({
  price,
  className,
}: {
  price: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {price === 0 ? "Free" : inr.format(price)}
    </span>
  );
}

/** Small uppercase label that opens a section. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

function lectureCount(n: number) {
  return `${n} lecture${n === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------------------
// CourseFilterBar
// ---------------------------------------------------------------------------

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

  const categories = useCourseCategories();
  const setCategory = (cat: string | undefined) =>
    onChange({ ...value, category: cat });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by title or topic…"
          className="bg-card h-11 rounded-full pl-10"
          aria-label="Search courses"
        />
      </div>

      {categories.length > 0 && (
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          <FilterPill
            active={!value.category}
            onClick={() => setCategory(undefined)}
          >
            All courses
          </FilterPill>
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              active={value.category === cat}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-visible:ring-ring shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
        active
          ? "border-foreground bg-foreground text-background"
          : "text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-card",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CourseCard
// ---------------------------------------------------------------------------

export function CourseCard({ course }: { course: CourseCard }) {
  const { isOwned } = useCourseAccess(course.id);
  return (
    <Link
      to={courseDetailPath(course.id)}
      className="group focus-visible:ring-ring block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <article className="bg-card flex h-full flex-col overflow-hidden rounded-lg border transition-shadow duration-300 group-hover:shadow-md">
        <div className="bg-muted relative aspect-video overflow-hidden">
          <img
            src={course.poster.url}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {isOwned && (
            <span className="bg-highlight text-highlight-foreground absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm">
              <BadgeCheck className="size-3.5" />
              Enrolled
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <Eyebrow>{course.category}</Eyebrow>
          <h3 className="font-display group-hover:text-primary mt-2 line-clamp-2 text-lg leading-snug font-semibold transition-colors">
            {course.title}
          </h3>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {course.createdBy}
          </p>

          <div className="mt-5 flex items-end justify-between gap-3 border-t pt-4">
            <span className="text-muted-foreground font-mono text-xs">
              {lectureCount(course.numberOfVideos)}
            </span>
            <PriceTag
              price={course.price}
              className="text-base font-semibold"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-lg border">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
        <div className="mt-4 flex justify-between border-t pt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CourseGrid
// ---------------------------------------------------------------------------

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
          <p>{errorMessage(error, "Something went wrong.")}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-dashed py-16 text-center">
        <p className="font-display text-lg">No courses match that</p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
          Try a different keyword, or clear the category filter to see
          everything in the catalog.
        </p>
      </div>
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
// LectureList
// ---------------------------------------------------------------------------

export function LectureList({
  courseId,
  lectures,
}: {
  courseId: string;
  lectures: Lecture[];
}) {
  if (lectures.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">
          No lectures published yet — check back soon.
        </p>
      </div>
    );
  }

  return (
    <ol className="bg-card divide-y overflow-hidden rounded-lg border">
      {lectures.map((lec, idx) => {
        const started = (getProgress(lec.id) ?? 0) > 0;
        return (
          <li key={lec.id}>
            <Link
              to={lecturePlayerPath(courseId, lec.id)}
              className="hover:bg-accent/50 focus-visible:ring-ring group flex items-start gap-4 px-5 py-4 transition-colors focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
            >
              <span className="text-muted-foreground group-hover:border-primary group-hover:text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors">
                {idx + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {lec.title}
                  </span>
                  {started && (
                    <span
                      className="bg-highlight size-1.5 shrink-0 rounded-full"
                      title="In progress"
                    />
                  )}
                </span>
                <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs">
                  {lec.description}
                </span>
              </span>

              <PlayCircle className="text-muted-foreground group-hover:text-primary mt-0.5 size-5 shrink-0 transition-colors" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// PaywallCard
// ---------------------------------------------------------------------------

const INCLUDED = [
  { icon: InfinityIcon, label: "Lifetime access once you enrol" },
  { icon: PlayCircle, label: "Resumes where you left off" },
  { icon: Smartphone, label: "Watch on any device you sign in from" },
];

export function PaywallCard({
  courseId,
  price,
  numberOfVideos,
}: {
  courseId: string;
  price: number;
  numberOfVideos: number;
}) {
  const { isAuthenticated } = useAuth();

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-6">
        <PriceTag price={price} className="font-display text-3xl font-semibold" />
        <p className="text-muted-foreground mt-1 text-sm">
          {price === 0
            ? "Free course — no payment needed."
            : "One-time payment. No subscription."}
        </p>

        <div className="mt-5">
          <CheckoutButton courseId={courseId} />
        </div>

        {!isAuthenticated && (
          <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
            <Lock className="size-3" />
            You'll come straight back here after signing in.
          </p>
        )}

        <ul className="mt-6 space-y-3 border-t pt-6">
          <li className="text-muted-foreground flex items-center gap-2.5 text-sm">
            <Layers className="text-primary size-4 shrink-0" />
            {lectureCount(numberOfVideos)}
          </li>
          {INCLUDED.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="text-muted-foreground flex items-center gap-2.5 text-sm"
            >
              <Icon className="text-primary size-4 shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Sidebar card for a course the user already owns. */
function EnrolledCard({
  courseId,
  numberOfVideos,
  firstLectureId,
}: {
  courseId: string;
  numberOfVideos: number;
  firstLectureId?: string;
}) {
  const resumeId = getLastLecture(courseId) ?? firstLectureId;
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-6">
        <span className="bg-highlight text-highlight-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
          <BadgeCheck className="size-3.5" />
          You're enrolled
        </span>
        <p className="font-display mt-4 text-xl font-semibold">
          {lectureCount(numberOfVideos)} waiting
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Your progress is saved as you watch.
        </p>
        {resumeId && (
          <Button asChild className="mt-5 w-full">
            <Link to={lecturePlayerPath(courseId, resumeId)}>
              <PlayCircle className="size-4" />
              {getLastLecture(courseId) ? "Resume course" : "Start learning"}
            </Link>
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
 * — the detail endpoint only returns lectures, not the meta). The list query
 * is mounted app-wide by the footer, so a deep link resolves too.
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
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-card mx-auto max-w-md rounded-lg border border-dashed px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Course not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This course may have been removed, or the link is wrong.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to={ROUTES.COURSES}>Back to all courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      <div className="min-w-0">
        <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg border">
          <img
            src={course.poster.url}
            alt=""
            className="size-full object-cover"
          />
        </div>

        <div className="mt-8">
          <Eyebrow>{course.category}</Eyebrow>
          <h1 className="font-display mt-3 text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            {course.title}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Taught by{" "}
            <span className="text-foreground font-medium">
              {course.createdBy}
            </span>
          </p>
          <p className="font-display mt-6 max-w-prose leading-relaxed text-pretty">
            {course.description}
          </p>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold">
            Course content
          </h2>
          <p className="text-muted-foreground mt-1 mb-5 text-sm">
            {lectureCount(course.numberOfVideos)}
          </p>

          {hasAccess ? (
            lectures.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : lectures.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load lectures</AlertTitle>
                <AlertDescription>
                  {errorMessage(lectures.error, "Something went wrong.")}
                </AlertDescription>
              </Alert>
            ) : (
              <LectureList courseId={courseId} lectures={lectures.data ?? []} />
            )
          ) : (
            <LockedContentPreview count={course.numberOfVideos} />
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        {hasAccess ? (
          <EnrolledCard
            courseId={courseId}
            numberOfVideos={course.numberOfVideos}
            firstLectureId={lectures.data?.[0]?.id}
          />
        ) : (
          <PaywallCard
            courseId={courseId}
            price={course.price}
            numberOfVideos={course.numberOfVideos}
          />
        )}
      </aside>
    </div>
  );
}

/** Placeholder rows standing in for the locked lecture list. */
function LockedContentPreview({ count }: { count: number }) {
  return (
    <div className="bg-card relative overflow-hidden rounded-lg border">
      <ul className="divide-y" aria-hidden="true">
        {Array.from({ length: Math.min(Math.max(count, 3), 5) }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-4 opacity-40">
            <span className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs">
              {i + 1}
            </span>
            <span className="bg-muted h-3 flex-1 rounded" style={{ maxWidth: `${70 - i * 8}%` }} />
          </li>
        ))}
      </ul>
      <div className="from-card absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t to-transparent pt-16 pb-6">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Lock className="size-4" />
          Enrol to unlock every lecture
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeaturedCourses — landing page strip
// ---------------------------------------------------------------------------

/**
 * A grid of up to N course cards. Re-uses the existing `useCourses({})` cache
 * so the landing page, the catalog, and the footer share one network request.
 */
export function FeaturedCourses({ limit = 6 }: { limit?: number }) {
  const { data, isLoading } = useCourses({});
  const items = useMemo(() => data?.slice(0, limit) ?? [], [data, limit]);

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-dashed py-16 text-center">
        <p className="font-display text-lg">The catalog is being stocked</p>
        <p className="text-muted-foreground mt-2 text-sm">
          New courses will show up here as soon as they're published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
