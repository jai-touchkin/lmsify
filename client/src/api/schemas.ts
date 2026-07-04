/**
 * Zod schemas + inferred types shared between the API layer and form validation.
 * Mirrors the BE contracts in `server/src/schemas/{auth,user}.schema.ts` and
 * the `toClient` / `toClientSummary` transforms in `server/src/utils/toClient.ts`.
 *
 * Why a single file: FE-2 only has a handful of auth-shaped payloads. Splitting
 * into `auth.schemas.ts` / `user.schemas.ts` would add file noise without buying
 * anything. Re-split later if it grows.
 */
import { z } from "zod";

// --- Request bodies ---------------------------------------------------------

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name must be at most 80 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

/** Strip the FE-only `confirmPassword` before sending to the BE. */
export type RegisterPayload = Omit<RegisterInput, "confirmPassword">;

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    email: z.email().optional(),
  })
  .refine((d) => Boolean(d.name) || Boolean(d.email), {
    message: "Provide at least one of name or email",
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// --- Response bodies --------------------------------------------------------

export const userRoleSchema = z.enum(["user", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Minimal shape returned by /register, /login. */
export const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  role: userRoleSchema,
});
export type UserSummary = z.infer<typeof userSummarySchema>;

/** Full shape returned by /me and /updateprofile. */
export const playlistEntrySchema = z.object({
  course: z.string(),
  poster: z.string(),
});
export const userSchema = userSummarySchema.extend({
  purchasedCourses: z.array(z.string()),
  playlist: z.array(playlistEntrySchema),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;
