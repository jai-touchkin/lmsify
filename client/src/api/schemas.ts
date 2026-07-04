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
  password: z.string().min(6, "Password lenght must be greater that 6 character"),
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

// ---------------------------------------------------------------------------
// Course shapes (BE-3 / BE-4)
// ---------------------------------------------------------------------------

/** Shared by `course.poster` and `lecture.video`. */
export const assetSchema = z.object({
  publicId: z.string().min(1),
  url: z.url(),
});
export type Asset = z.infer<typeof assetSchema>;

/** One item in GET /api/v1/courses → { courses: CourseCard[] }. */
export const courseCardSchema = z.object({
  id: z.string(),
  title: z.string().min(5).max(50),
  description: z.string().min(5),
  category: z.string(), // free-form, NOT an enum
  createdBy: z.string(), // admin display name
  price: z.number().min(0), // INR rupees; 0 = free
  poster: assetSchema,
  numberOfVideos: z.number().int().min(0),
  views: z.number().int().min(0),
});
export type CourseCard = z.infer<typeof courseCardSchema>;

/** One item in GET /api/v1/courses/:id → { lectures: Lecture[] }. */
export const lectureSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  video: assetSchema,
});
export type Lecture = z.infer<typeof lectureSchema>;

// Response envelopes
export const courseListSchema = z.object({
  success: z.literal(true),
  courses: z.array(courseCardSchema),
});
export const courseLecturesSchema = z.object({
  success: z.literal(true),
  lectures: z.array(lectureSchema),
});

// Query params for the filter bar
export const courseFilterSchema = z.object({
  keyword: z.string().optional(),
  category: z.string().optional(),
});
export type CourseFilter = z.infer<typeof courseFilterSchema>;
