/**
 * Auth feature — single flat file. Co-locates the API calls, TanStack Query
 * hooks, route guards, refresh-on-boot gate, redirect helper, and the three
 * RHF + Zod forms (Login / Register / Profile).
 *
 * No nested folders: FE-2 has seven files for one feature, and splitting them
 * into `api/`, `components/`, `hooks/`, `routes/`, `types/` would just add
 * indirection. Re-split when this file gets large.
 *
 * The mix of non-component exports (API, hooks, schemas) is intentional, so
 * Fast Refresh's "only-export-components" warning is suppressed for the file.
 */
/* eslint-disable react-refresh/only-export-components */
import { forwardRef, useEffect, useState, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Navigate,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/client";
import { ENDPOINTS, ROUTES } from "@/api/endpoints";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  type LoginInput,
  type RegisterInput,
  type RegisterPayload,
  type UpdateProfileInput,
  type User,
  type UserSummary,
} from "@/api/schemas";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ---------------------------------------------------------------------------
// API layer
// ---------------------------------------------------------------------------

/** Pull the BE's flat `{ success: false, message }` string out of an axios err. */
function errMsg(e: unknown): string {
  const ax = e as AxiosError<{ message?: string }>;
  return ax?.response?.data?.message ?? ax?.message ?? "Something went wrong";
}

type AuthResponse = {
  success: true;
  message: string;
  accessToken: string;
  user: UserSummary;
};

const authApi = {
  login: (i: LoginInput) =>
    api.post<AuthResponse>(ENDPOINTS.login, i).then((r) => r.data),
  register: (i: RegisterPayload) =>
    api.post<AuthResponse>(ENDPOINTS.register, i).then((r) => r.data),
  logout: () => api.post<{ success: true; message: string }>(ENDPOINTS.logout),
  me: () =>
    api
      .get<{ success: true; user: User }>(ENDPOINTS.me)
      .then((r) => r.data.user),
  updateProfile: (i: UpdateProfileInput) =>
    api
      .put<{ success: true; message: string; user: User }>(
        ENDPOINTS.updateProfile,
        i,
      )
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Query keys + TanStack Query hooks
// ---------------------------------------------------------------------------

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * `useMe` — single source of truth for the current user's full shape. The
 * refresh-on-boot query is a no-op retry-wise when the cookie is gone; the
 * 401 from `/auth/refresh` clears the store via the interceptor.
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      useAuthStore.getState().setSession(data.accessToken, data.user);
      // Let `useMe` refetch the full user shape on next mount.
      void qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: RegisterInput) => {
      // Drop the FE-only `confirmPassword` before hitting the BE.
      const payload: RegisterPayload = {
        name: i.name,
        email: i.email,
        password: i.password,
      };
      return authApi.register(payload);
    },
    onSuccess: (data) => {
      useAuthStore.getState().setSession(data.accessToken, data.user);
      void qc.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      useAuthStore.getState().clear();
      qc.clear();
    },
    // Logout is best-effort: even if the BE 401s, the local session is gone.
    onError: () => {
      useAuthStore.getState().clear();
      qc.clear();
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
    },
  });
}

// ---------------------------------------------------------------------------
// AuthBootstrap — refresh-on-boot, gates visible content
// ---------------------------------------------------------------------------

/**
 * Runs `useMe` once on mount. The 401 interceptor will transparently refresh
 * the access token from the httpOnly cookie if needed; only when the cookie
 * itself is gone does the query settle as an error and the store stays empty.
 *
 * While loading, shows a full-viewport loader so we never flash a logged-out
 * UI to a user who is actually logged in.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const { isLoading, data } = useMe();
  const { setUser } = useAuth();

  // Sync on every change to `data`, not just when the store is empty. A
  // purchase invalidates `/me`, and the refetched user carries the new
  // `purchasedCourses` — gating on `!user` would drop that update and leave
  // the student staring at the paywall for a course they just bought.
  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  if (isLoading) return <PageLoader />;
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// ProtectedRoute — auth + role guard
// ---------------------------------------------------------------------------

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: "user" | "admin";
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.LOGIN}?next=${next}`} replace />;
  }
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// useAuthRedirect — post-auth navigation
// ---------------------------------------------------------------------------

/**
 * Returns a function that navigates to the `?next=` query param if present,
 * else `fallback` (default `/`). Call after a successful login/register/logout.
 */
export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  return (fallback: string = ROUTES.HOME) => {
    const next = new URLSearchParams(location.search).get("next");
    navigate(next ?? fallback, { replace: true });
  };
}

// ---------------------------------------------------------------------------
// PasswordInput — local helper (15 lines)
// ---------------------------------------------------------------------------

const PasswordInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={show ? "text" : "password"}
        autoComplete={props.autoComplete ?? "current-password"}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1 -translate-y-1/2"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const login = useLogin();
  const redirect = useAuthRedirect();

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (data) => {
        toast.success(data.message || "Signed in");
        redirect();
      },
      onError: (e) => {
        form.setError("root", { message: errMsg(e) });
      },
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={login.isPending}
        >
          {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Don't have an account?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// RegisterForm
// ---------------------------------------------------------------------------

export function RegisterForm() {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const register = useRegister();
  const redirect = useAuthRedirect();

  const onSubmit = form.handleSubmit((values) => {
    register.mutate(values, {
      onSuccess: (data) => {
        toast.success(data.message || "Account created");
        redirect();
      },
      onError: (e) => {
        form.setError("root", { message: errMsg(e) });
      },
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertTitle>Could not create account</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={register.isPending}
        >
          {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// ProfileForm
// ---------------------------------------------------------------------------

export function ProfileForm() {
  const { user, isAuthenticated } = useAuth();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const navigate = useNavigate();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });

  // Re-sync defaults if the store updates after mount (e.g. after a /me fetch).
  useEffect(() => {
    if (user) form.reset({ name: user.name, email: user.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!isAuthenticated || !user) {
    // Should be unreachable behind <ProtectedRoute>, but render a quiet fallback
    // rather than crash if a render race happens.
    return null;
  }

  const onSubmit = form.handleSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: (data) => {
        toast.success(data.message || "Profile updated");
        form.reset({ name: data.user.name, email: data.user.email });
      },
      onError: (e) => {
        form.setError("root", { message: errMsg(e) });
      },
    });
  });

  const onSignOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success("Signed out");
        navigate(ROUTES.LOGIN, { replace: true });
      },
    });
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertTitle>Update failed</AlertTitle>
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </form>
      </Form>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Session</p>
          <p className="text-muted-foreground text-sm">
            Signing out ends this session on this device only.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onSignOut}
          disabled={logout.isPending}
        >
          {logout.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sign out
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared auth card wrapper (used by LoginPage / RegisterPage)
// ---------------------------------------------------------------------------

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  // No card chrome — the auth layout already centres this on an otherwise
  // empty page, and a box inside a box reads as clutter.
  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
