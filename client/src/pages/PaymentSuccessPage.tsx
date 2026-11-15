import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, courseDetailPath } from "@/api/endpoints";
import { Button } from "@/components/ui/button";

export function PaymentSuccessPage() {
  useDocumentTitle("Payment successful");
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const reference = searchParams.get("reference");

  if (!courseId || !reference) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">
          Nothing to show here
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This page needs a course and a payment reference, which usually means
          you arrived from somewhere other than checkout.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to={ROUTES.LEARNING}>Go to My learning</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <span className="bg-success text-success-foreground mx-auto flex size-12 items-center justify-center rounded-full">
        <Check className="size-6" strokeWidth={2.5} />
      </span>

      <h1 className="font-display mt-6 text-3xl font-semibold text-balance">
        You're enrolled
      </h1>
      <p className="text-muted-foreground mt-3 text-pretty">
        The payment cleared verification and the course is on your account for
        good. Nothing renews and nothing expires.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Button asChild size="lg">
          <Link to={courseDetailPath(courseId)}>
            Start learning
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to={ROUTES.LEARNING}>Go to My learning</Link>
        </Button>
      </div>

      <div className="mt-10 border-t pt-6">
        <p className="text-muted-foreground font-mono text-xs">
          Payment reference
        </p>
        <p className="mt-1 font-mono text-xs break-all select-all">
          {reference}
        </p>
      </div>
    </div>
  );
}
