import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { ROUTES } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription>
            We couldn't find that page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={ROUTES.HOME}>
              <Home className="h-4 w-4" />
              Back home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
