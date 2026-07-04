# `src/api/`

All HTTP plumbing. Feature code never imports `axios` directly.

- `client.ts` — single axios instance + 401 → /auth/refresh interceptor.
- `endpoints.ts` — URL constants (`ENDPOINTS.*` for BE paths, `ROUTES.*` for FE paths).
- `schemas.ts` — Zod v4 schemas (login, register, update profile, user shapes)
  shared with form validation. Mirrors `server/src/schemas/`.

Feature code lives under `src/features/`. See `src/features/auth.ts` for the
auth API/queries/forms/route-guards.

## Auth model

- Access token: returned by /register and /login, kept in `useAuthStore`
  (Zustand, in-memory only — never localStorage).
- Refresh token: set by BE as an httpOnly cookie scoped to `/api/v1/auth`.
  Browser sends it automatically; the JS layer never reads it.
- The interceptor in `client.ts` is the **only** place that ever calls
  `/auth/refresh`. Do not call it from feature code.
