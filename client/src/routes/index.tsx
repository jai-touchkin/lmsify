import { Outlet, createBrowserRouter } from "react-router-dom";
import { AuthBootstrap, ProtectedRoute } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LearningPage } from "@/pages/LearningPage";
import { CoursesPage } from "@/pages/CoursesPage";
import { CourseDetailPage } from "@/pages/CourseDetailPage";
import { LecturePlayerPage } from "@/pages/LecturePlayerPage";
import { PaymentSuccessPage } from "@/pages/PaymentSuccessPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Top-level router. <AuthBootstrap> runs the refresh-on-boot query and gates
 * visible content while the session is being restored. Inside it, two layout
 * routes supply the page chrome: <RootLayout> (header + footer) for content
 * pages and <AuthLayout> (minimal, centred) for sign-in / register.
 *
 * Public routes are reachable without a session; /learning and /auth/profile
 * sit behind <ProtectedRoute>. The course detail route is public — its
 * internal paywall handles auth + purchase gating.
 *
 * Route order matters: the `*` catch-all stays LAST so it doesn't shadow the
 * `/courses/:id` dynamic segment.
 */
export const router = createBrowserRouter([
  {
    element: (
      <AuthBootstrap>
        <Outlet />
      </AuthBootstrap>
    ),
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: ROUTES.HOME, element: <HomePage /> },
          { path: ROUTES.COURSES, element: <CoursesPage /> },
          { path: ROUTES.COURSE_DETAIL, element: <CourseDetailPage /> },
          { path: ROUTES.LECTURE_PLAYER, element: <LecturePlayerPage /> },
          { path: ROUTES.PAYMENT_SUCCESS, element: <PaymentSuccessPage /> },
          {
            path: ROUTES.LEARNING,
            element: (
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ROUTES.PROFILE,
            element: (
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.REGISTER, element: <RegisterPage /> },
        ],
      },
      { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
    ],
  },
]);
