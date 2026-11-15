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
  courses: "/courses",
  paymentCreateOrder: "/payment/create-order",
  paymentVerify: "/payment/verify",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  PROFILE: "/auth/profile",
  LEARNING: "/learning",
  COURSES: "/courses",
  COURSE_DETAIL: "/courses/:id", // router pattern, not for <Link>
  LECTURE_PLAYER: "/courses/:id/lectures/:lectureId", // router pattern
  PAYMENT_SUCCESS: "/payment/success",
  NOT_FOUND: "*",
} as const;

/** Build the path used in `<Link to={...}>` for a course detail page. */
export const courseDetailPath = (id: string) => `/courses/${id}`;

/** Build the path used in `<Link to={...}>` for the lecture player page. */
export const lecturePlayerPath = (courseId: string, lectureId: string) =>
  `/courses/${courseId}/lectures/${lectureId}`;
