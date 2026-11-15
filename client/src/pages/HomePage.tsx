import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  Infinity as InfinityIcon,
  ListFilter,
  MonitorSmartphone,
  ShieldCheck,
  Timer,
} from "lucide-react";

import {
  Eyebrow,
  FeaturedCourses,
  PriceTag,
  useCourseCategories,
  useCourses,
  useOwnedCourses,
} from "@/features/courses";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, courseDetailPath } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/brand/Highlighter";

export function HomePage() {
  useDocumentTitle("Lmsify");

  return (
    <>
      <Hero />
      <Included />
      <Featured />
      <Topics />
      <HowItWorks />
      <Faq />
      <ClosingCta />
    </>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  const { user, isAuthenticated } = useAuth();
  const { courses: owned } = useOwnedCourses();
  const firstName = user?.name?.split(" ")[0];

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-24">
      <div>
        {isAuthenticated ? (
          <>
            <Eyebrow>Welcome back{firstName ? `, ${firstName}` : ""}</Eyebrow>
            <h1 className="font-display mt-4 text-4xl leading-[1.08] font-semibold text-balance sm:text-5xl">
              {owned.length > 0 ? (
                <>
                  Pick up <Highlighter>where you stopped</Highlighter>.
                </>
              ) : (
                <>
                  Find the course <Highlighter>worth your time</Highlighter>.
                </>
              )}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-md text-lg leading-relaxed">
              {owned.length > 0
                ? `You're enrolled in ${owned.length} course${owned.length === 1 ? "" : "s"}. Every lecture starts at the second you left it.`
                : "Browse the catalog, enrol once, and keep the course for good."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {owned.length > 0 && (
                <Button asChild size="lg">
                  <Link to={ROUTES.LEARNING}>
                    Continue learning
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant={owned.length > 0 ? "outline" : "default"}
              >
                <Link to={ROUTES.COURSES}>Browse courses</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <Eyebrow>Video courses, bought once</Eyebrow>
            <h1 className="font-display mt-4 text-4xl leading-[1.08] font-semibold text-balance sm:text-5xl lg:text-[3.4rem]">
              Courses you buy once and{" "}
              <Highlighter>keep for good</Highlighter>.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-md text-lg leading-relaxed">
              No subscription, no expiry date. Enrol, and the course sits on
              your account waiting — starting at the second you last stopped.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={ROUTES.COURSES}>
                  Browse courses
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={ROUTES.REGISTER}>Create an account</Link>
              </Button>
            </div>
          </>
        )}

        <ul className="text-muted-foreground mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6 text-sm">
          <TrustItem icon={BadgeIndianRupee}>Priced in rupees</TrustItem>
          <TrustItem icon={InfinityIcon}>Lifetime access</TrustItem>
          <TrustItem icon={ShieldCheck}>Razorpay checkout</TrustItem>
        </ul>
      </div>

      <PosterStack />
    </section>
  );
}

function TrustItem({
  icon: Icon,
  children,
}: {
  icon: typeof ShieldCheck;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="text-primary size-4" />
      {children}
    </li>
  );
}

/**
 * The hero image is the catalog itself: the three most recent course posters,
 * stacked like books left on a desk. Reads from the shared `useCourses({})`
 * cache, so it costs no extra request, and it degrades to a quiet type panel
 * when the catalog is empty.
 */
function PosterStack() {
  const { data, isLoading } = useCourses({});
  const items = (data ?? []).slice(0, 3);

  if (isLoading) {
    return (
      <div className="bg-muted/60 aspect-[4/3] w-full animate-pulse rounded-xl" />
    );
  }

  const front = items[0];
  if (!front) {
    return (
      <div className="bg-card flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border border-dashed px-8 text-center">
        <p className="font-display text-xl font-semibold">
          The shelf is still filling up
        </p>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">
          Courses appear here the moment they're published.
        </p>
      </div>
    );
  }

  // Only the front card is a real card. The ones behind it are bare posters
  // peeking out, which is what makes the pile read as a pile.
  const behind = items.slice(1);

  return (
    <div className="relative mx-auto w-full max-w-lg pt-[9%]">
      {behind.map((course, i) => (
        <div
          key={course.id}
          aria-hidden="true"
          className={`bg-card absolute inset-x-0 top-0 aspect-video overflow-hidden rounded-xl border shadow-md ${
            BEHIND_STYLES[i] ?? BEHIND_STYLES[1]
          }`}
        >
          <img
            src={course.poster.url}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ))}

      <Link
        to={courseDetailPath(front.id)}
        className="bg-card focus-visible:ring-ring relative z-10 block rotate-[-1.5deg] overflow-hidden rounded-xl border shadow-lg transition-transform duration-300 hover:rotate-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="bg-muted aspect-video w-full overflow-hidden">
          <img
            src={front.poster.url}
            alt=""
            className="size-full object-cover"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <span className="font-display min-w-0 truncate text-sm font-semibold">
            {front.title}
          </span>
          <PriceTag price={front.price} className="text-sm font-semibold" />
        </div>
      </Link>
    </div>
  );
}

const BEHIND_STYLES = [
  "z-[5] translate-x-[5%] -translate-y-[4%] rotate-[4deg]",
  "z-[1] -translate-x-[4%] -translate-y-[8%] rotate-[-6deg]",
] as const;

// ---------------------------------------------------------------------------
// What's included
// ---------------------------------------------------------------------------

const INCLUDED = [
  {
    icon: InfinityIcon,
    title: "Access that doesn't expire",
    body: "Enrol once and the course stays on your account. Nothing renews, nothing lapses.",
  },
  {
    icon: Timer,
    title: "Resumes at the right second",
    body: "Playback position is saved while you watch, so the next session opens exactly where you stopped.",
  },
  {
    icon: ShieldCheck,
    title: "Payments verified server-side",
    body: "The browser never decides whether you paid. Every payment signature is checked on our servers before access opens.",
  },
  {
    icon: BadgeIndianRupee,
    title: "One-time price in rupees",
    body: "Card, UPI, netbanking or wallet through Razorpay. No subscription to cancel later.",
  },
  {
    icon: MonitorSmartphone,
    title: "Any device you sign in from",
    body: "Enrolments follow your account, not the browser. Start on a laptop, finish on a phone.",
  },
  {
    icon: ListFilter,
    title: "A catalog you can actually search",
    body: "Filter by topic or search titles. Filtered views live in the URL, so they're shareable.",
  },
];

function Included() {
  return (
    <Section>
      <SectionHead
        eyebrow="What you get"
        title="Included with every course"
        lead="The same terms on everything in the catalog — nothing is held back for a higher tier."
      />
      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {INCLUDED.map(({ icon: Icon, title, body }) => (
          <div key={title}>
            <span className="border-primary/25 bg-primary/5 text-primary flex size-10 items-center justify-center rounded-lg border">
              <Icon className="size-5" />
            </span>
            <h3 className="font-display mt-4 text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Featured courses
// ---------------------------------------------------------------------------

function Featured() {
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          eyebrow="From the catalog"
          title="Featured courses"
          lead="A sample of what's published right now."
        />
        <Button asChild variant="ghost" className="shrink-0">
          <Link to={ROUTES.COURSES}>
            See all courses
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-10">
        <FeaturedCourses limit={6} />
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

function Topics() {
  const categories = useCourseCategories(8);
  if (categories.length === 0) return null;

  return (
    <Section>
      <SectionHead
        eyebrow="Browse"
        title="Start with a topic"
        lead="Every topic below is a live filter over the catalog."
      />
      <ul className="mt-10 border-t">
        {categories.map((category) => (
          <li key={category}>
            <Link
              to={`${ROUTES.COURSES}?category=${encodeURIComponent(category)}`}
              className="group hover:bg-accent/40 focus-visible:ring-ring flex items-center justify-between gap-4 border-b px-2 py-5 transition-colors focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none"
            >
              <span className="font-display group-hover:text-primary text-xl font-medium transition-colors sm:text-2xl">
                {category}
              </span>
              <ArrowUpRight className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// How it works — a real sequence, so the numbers earn their place
// ---------------------------------------------------------------------------

const STEPS = [
  {
    title: "Find a course",
    body: "Search the catalog or filter by topic. Course pages are public, so you can read the description and lecture count before deciding.",
  },
  {
    title: "Enrol",
    body: "Pay once through Razorpay checkout. Access opens the moment the payment clears verification — there's nothing to wait for.",
  },
  {
    title: "Work through it",
    body: "Lectures play in order with your position saved as you go. Close the tab whenever; the next visit starts where you left it.",
  },
];

function HowItWorks() {
  return (
    <Section>
      <SectionHead eyebrow="How it works" title="Three steps, start to finish" />
      <ol className="mt-12 grid gap-10 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="border-t pt-6">
            <span className="text-highlight font-mono text-sm font-medium">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display mt-3 text-xl font-semibold">
              {step.title}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQS = [
  {
    q: "Does my access ever expire?",
    a: "No. Enrolment is recorded permanently against your account, so a course you bought stays available for as long as it's published.",
  },
  {
    q: "How do I pay, and in what currency?",
    a: "Prices are in Indian rupees. Checkout runs through Razorpay, so you can pay by card, UPI, netbanking or wallet. It's a single payment — there's no subscription.",
  },
  {
    q: "How do you know my payment went through?",
    a: "Your browser doesn't get to decide. Razorpay signs the payment, and our server verifies that signature before it unlocks anything. If verification fails, nothing is granted.",
  },
  {
    q: "Can I watch on my phone?",
    a: "Yes. Sign in on any device and your enrolments are there. Playback position is remembered per device, so a lecture you started on a laptop resumes on that laptop.",
  },
  {
    q: "Do I need an account just to look around?",
    a: "No. The catalog and every course page are public, including the description, topic and lecture count. You only need an account to enrol and watch.",
  },
  {
    q: "What happens if I close the tab mid-lecture?",
    a: "Nothing is lost. Your position is written as you watch, and reopening the lecture picks up from there.",
  },
];

function Faq() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <SectionHead
          eyebrow="Questions"
          title="Before you enrol"
          className="lg:sticky lg:top-24 lg:self-start"
        />
        <div className="border-t">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border-b">
              <summary className="focus-visible:ring-ring flex cursor-pointer items-center justify-between gap-6 py-5 text-left focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none">
                <span className="font-display text-base font-medium">{q}</span>
                <span
                  aria-hidden="true"
                  className="text-muted-foreground relative size-4 shrink-0"
                >
                  <span className="bg-current absolute top-1/2 left-0 h-px w-4 -translate-y-1/2" />
                  <span className="bg-current absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="text-muted-foreground max-w-prose pb-6 text-sm leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Closing CTA
// ---------------------------------------------------------------------------

function ClosingCta() {
  const { isAuthenticated } = useAuth();
  return (
    <Section>
      <div className="bg-card rounded-xl border px-6 py-14 text-center sm:px-12">
        <h2 className="font-display mx-auto max-w-lg text-3xl leading-tight font-semibold text-balance">
          Pick one course and actually finish it.
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-pretty">
          The catalog is public. Have a look before you decide anything.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to={ROUTES.COURSES}>
              Browse courses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          {!isAuthenticated && (
            <Button asChild size="lg" variant="outline">
              <Link to={ROUTES.REGISTER}>Create an account</Link>
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section scaffolding
// ---------------------------------------------------------------------------

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      {children}
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display mt-3 text-3xl leading-tight font-semibold text-balance sm:text-4xl">
        {title}
      </h2>
      {lead && (
        <p className="text-muted-foreground mt-3 max-w-md text-pretty">
          {lead}
        </p>
      )}
    </div>
  );
}
