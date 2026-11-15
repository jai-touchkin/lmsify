import { Link } from "react-router-dom";

import { ROUTES } from "@/api/endpoints";
import { useAuth } from "@/hooks/useAuth";
import { useCourseCategories } from "@/features/courses";
import { Logo } from "@/components/brand/Logo";

/**
 * Site footer. Every link here points at a route that actually exists — no
 * placeholder legal or social links that would land on the 404 page.
 *
 * `useCourseCategories` reads the shared `useCourses({})` cache. Because the
 * footer renders on every page inside `RootLayout`, that query is always
 * mounted, which is what keeps a deep-linked `/courses/:id` able to resolve
 * its metadata (the detail endpoint returns lectures only).
 */
export function Footer() {
  const { isAuthenticated } = useAuth();
  const categories = useCourseCategories(5);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              Video courses you buy once and keep. Pick up every lecture where
              you left it, on any device you sign in from.
            </p>
          </div>

          <FooterColumn title="Learn">
            <FooterLink to={ROUTES.COURSES}>All courses</FooterLink>
            {categories.map((category) => (
              <FooterLink
                key={category}
                to={`${ROUTES.COURSES}?category=${encodeURIComponent(category)}`}
              >
                {category}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Account">
            {isAuthenticated ? (
              <>
                <FooterLink to={ROUTES.LEARNING}>My learning</FooterLink>
                <FooterLink to={ROUTES.PROFILE}>Account details</FooterLink>
              </>
            ) : (
              <>
                <FooterLink to={ROUTES.LOGIN}>Sign in</FooterLink>
                <FooterLink to={ROUTES.REGISTER}>Create account</FooterLink>
              </>
            )}
          </FooterColumn>
        </div>

        <div className="text-muted-foreground mt-12 flex flex-col gap-2 border-t pt-6 font-mono text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Lmsify</p>
          <p>Payments processed securely by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-sans text-xs font-semibold tracking-[0.14em] uppercase">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <li>
      <Link
        to={to}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {children}
      </Link>
    </li>
  );
}
