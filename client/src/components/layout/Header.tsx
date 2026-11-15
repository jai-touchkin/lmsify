import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Dialog } from "radix-ui";
import {
  ChevronDown,
  GraduationCap,
  Library,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * App-wide header. Reads auth state from the store directly (no props) so
 * pages don't need to thread anything through.
 *
 * Sticky, with a translucent paper backdrop so content scrolls under it.
 * Primary nav is inline from `md` up and collapses into a sheet below that;
 * the signed-in account actions live in a dropdown rather than three
 * competing buttons.
 *
 * Pages that want a more minimal header (Login / Register — just the
 * wordmark + theme toggle) pass `variant="minimal"`.
 */
export function Header({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();
  const isFull = variant === "full";

  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        {isFull && (
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <HeaderLink to={ROUTES.COURSES}>Browse courses</HeaderLink>
            {isAuthenticated && (
              <HeaderLink to={ROUTES.LEARNING}>My learning</HeaderLink>
            )}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {isFull && isAuthenticated && (
            <AccountMenu
              name={user?.name ?? "Account"}
              email={user?.email ?? ""}
              onSignOut={() => logout.mutate(undefined)}
              signingOut={logout.isPending}
            />
          )}

          {isFull && !isAuthenticated && (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link to={ROUTES.LOGIN}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={ROUTES.REGISTER}>Create account</Link>
              </Button>
            </div>
          )}

          {isFull && (
            <MobileNav
              isAuthenticated={isAuthenticated}
              onSignOut={() => logout.mutate(undefined)}
              signingOut={logout.isPending}
            />
          )}
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Desktop nav link
// ---------------------------------------------------------------------------

function HeaderLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "focus-visible:ring-ring relative rounded-sm px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
          isActive
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="bg-highlight absolute inset-x-3 -bottom-px h-0.5 rounded-full" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// Account dropdown
// ---------------------------------------------------------------------------

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

function AccountMenu({
  name,
  email,
  onSignOut,
  signingOut,
}: {
  name: string;
  email: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 pr-2 pl-1.5">
          <span
            aria-hidden="true"
            className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-[0.65rem] font-semibold"
          >
            {initials(name)}
          </span>
          <span className="hidden max-w-28 truncate sm:inline">{name}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          {email && (
            <span className="text-muted-foreground block truncate text-xs">
              {email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.LEARNING}>
            <GraduationCap className="size-4" />
            My learning
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.COURSES}>
            <Library className="size-4" />
            Browse courses
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.PROFILE}>
            <UserRound className="size-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} disabled={signingOut}>
          {signingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Mobile sheet
// ---------------------------------------------------------------------------

function MobileNav({
  isAuthenticated,
  onSignOut,
  signingOut,
}: {
  isAuthenticated: boolean;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:hidden" />
        <Dialog.Content className="bg-card fixed inset-y-0 right-0 z-50 flex w-[min(18rem,78vw)] flex-col border-l p-6 shadow-xl md:hidden">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Site navigation
          </Dialog.Description>

          <div className="flex items-center justify-between">
            <Logo />
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close menu">
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            <SheetLink to={ROUTES.COURSES}>Browse courses</SheetLink>
            {isAuthenticated && (
              <>
                <SheetLink to={ROUTES.LEARNING}>My learning</SheetLink>
                <SheetLink to={ROUTES.PROFILE}>Account</SheetLink>
              </>
            )}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-8">
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={onSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Sign out
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link to={ROUTES.REGISTER}>Create account</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={ROUTES.LOGIN}>
                    <LogIn className="size-4" />
                    Sign in
                  </Link>
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Wrapped in `Dialog.Close` so following a link dismisses the sheet. Radix
 * handles it on click, which beats watching the location and closing after
 * the fact.
 */
function SheetLink({ to, children }: { to: string; children: string }) {
  return (
    <Dialog.Close asChild>
      <NavLink
        to={to}
        end
        className={({ isActive }) =>
          cn(
            "rounded-md px-3 py-2.5 text-sm transition-colors",
            isActive
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )
        }
      >
        {children}
      </NavLink>
    </Dialog.Close>
  );
}
