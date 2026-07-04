import { CourseFilterBar, CourseGrid, useCourses } from "@/features/courses";
import { Header } from "@/components/layout/Header";
import { type CourseFilter } from "@/api/schemas";
import { useSearchParams } from "react-router-dom";

/**
 * Public courses list page. Filter state lives in the URL so a hard refresh
 * preserves the user's selection and deep links (`/courses?category=design`)
 * work. The page body is just the filter bar + the responsive grid; the
 * shared Header sits on top.
 */
export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const category = searchParams.get("category") ?? "";

  const setFilter = (next: CourseFilter) => {
    const sp = new URLSearchParams();
    if (next.keyword) sp.set("keyword", next.keyword);
    if (next.category) sp.set("category", next.category);
    setSearchParams(sp, { replace: true });
  };

  const { data, isLoading, isError, error, refetch } = useCourses({
    keyword,
    category,
  });

  return (
    <main className="bg-background text-foreground min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse courses</h1>
          <p className="text-muted-foreground text-sm">
            Find your next course by topic or keyword.
          </p>
        </div>
        <CourseFilterBar
          value={{ keyword, category }}
          onChange={setFilter}
        />
        <CourseGrid
          courses={data ?? []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    </main>
  );
}
