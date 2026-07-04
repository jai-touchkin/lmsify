import { create } from "zustand";
import type { User, UserSummary } from "@/api/schemas";

/**
 * What we have in the store after login vs. after `/me`:
 *  - `setSession` is called with the summary returned by /login + /register.
 *  - `setUser` is called with the full `toClient` shape from /me + /updateprofile.
 *  - `useMe` upgrades the summary to the full shape on first successful fetch.
 *
 * The public type is `User | null` because callers (HomePage, ProfileForm)
 * already access fields that exist on both shapes (name, email, role) and
 * the few extra fields (purchasedCourses, playlist) are only read on the
 * profile page after /me has populated them.
 */
type SessionUser = User | UserSummary;

interface AuthState {
  accessToken: string | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
  setSession: (accessToken: string, user: UserSummary) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

/**
 * In-memory only. The refresh token lives in an httpOnly cookie and is never
 * readable from JS — this store is the authoritative home of the access token
 * between renders. On hard refresh the store is empty; FE-2 adds a
 * `/auth/refresh`-on-boot hook to restore the session from the cookie.
 *
 * NO `persist` middleware — that would defeat the security model.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setSession: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),
  setAccessToken: (accessToken) =>
    set((s) => ({ ...s, accessToken, isAuthenticated: accessToken !== null })),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
