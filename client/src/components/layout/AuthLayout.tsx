import { Link, Outlet } from "react-router-dom";

import { ROUTES } from "@/api/endpoints";
import { Header } from "@/components/layout/Header";

/**
 * Chrome for the sign-in / register pages: minimal header, a centred column,
 * and no footer — nothing competing with the form.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="minimal" />

      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-sm">
          <Outlet />
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Just browsing?{" "}
          <Link
            to={ROUTES.COURSES}
            className="text-foreground underline underline-offset-4"
          >
            Look through the catalog
          </Link>{" "}
          without an account.
        </p>
      </main>
    </div>
  );
}
