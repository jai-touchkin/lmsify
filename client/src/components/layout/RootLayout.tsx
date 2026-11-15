import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Chrome shared by every content page: skip link, sticky header, and the
 * footer. Pages render their own content only — they no longer repeat the
 * `<main>` wrapper each one used to carry.
 */
export function RootLayout() {
  const { pathname } = useLocation();

  // The SPA keeps scroll position across navigations, which reads as broken
  // when moving from a long catalog to a course page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only rounded-md px-4 py-2 text-sm focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>

      <Header />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
