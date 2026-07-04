import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES, courseDetailPath } from "@/api/endpoints";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const reference = searchParams.get("reference");

  if (!courseId || !reference) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <Header />
        <div className="mx-auto max-w-md px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Missing details</CardTitle>
              <CardDescription>
                This page requires course and payment information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to={ROUTES.HOME}>Back to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="text-green-600 mx-auto h-12 w-12 mb-4" />
            <CardTitle>Payment successful!</CardTitle>
            <CardDescription>
              Your payment was processed. You now have lifetime access to the
              course.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-xs text-muted-foreground">
              Reference: {reference}
            </p>
            <Button asChild className="w-full">
              <Link to={courseDetailPath(courseId)}>Start learning</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={ROUTES.HOME}>Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}