/**
 * Single source of truth for backend endpoint paths and frontend route paths.
 *
 * Feature code never hardcodes URLs — it imports these constants. The
 * `authApi` calls below join with the `api` instance's `baseURL` to form the
 * full request URL.
 */
export const ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  me: "/auth/me",
  updateProfile: "/user/updateprofile",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  PROFILE: "/auth/profile",
  NOT_FOUND: "*",
} as const;
