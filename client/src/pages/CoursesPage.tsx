import { useSearchParams } from "react-router-dom";

import {
  CourseFilterBar,
  CourseGrid,
  Eyebrow,
  useCourses,
} from "@/features/courses";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { type CourseFilter } from "@/api/schemas";

/**
 * Public courses list page. Filter state lives in the URL so a hard refresh
 * preserves the user's selection and deep links (`/courses?category=design`)
 * work.
 */
export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const category = searchParams.get("category") ?? "";

  useDocumentTitle(category ? `${category} courses` : "All courses");

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

  const count = data?.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-2xl">
        <Eyebrow>Catalog</Eyebrow>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
          {category ? category : "Every course"}
        </h1>
        <p className="text-muted-foreground mt-3">
          Course pages are public — read the description and lecture list
          before you decide.
        </p>
      </header>

      <div className="mt-10">
        <CourseFilterBar value={{ keyword, category }} onChange={setFilter} />
      </div>

      {!isLoading && !isError && count > 0 && (
        <p className="text-muted-foreground mt-8 font-mono text-xs">
          {count} course{count === 1 ? "" : "s"}
          {keyword ? ` matching “${keyword}”` : ""}
        </p>
      )}

      <div className="mt-6">
        <CourseGrid
          courses={data ?? []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  );
}
