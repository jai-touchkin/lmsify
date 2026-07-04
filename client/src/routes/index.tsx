import { Outlet, createBrowserRouter } from "react-router-dom";
import { AuthBootstrap, ProtectedRoute } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { CoursesPage } from "@/pages/CoursesPage";
import { CourseDetailPage } from "@/pages/CourseDetailPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Top-level router. <AuthBootstrap> runs the refresh-on-boot query and gates
 * visible content while the session is being restored. Public routes are
 * reachable without a session; only /auth/profile is behind <ProtectedRoute>.
 *
 * The course detail route is public too — its internal paywall handles
 * auth + purchase gating.
 *
 * Route order matters: put the `*` catch-all LAST so it doesn't shadow the
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
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      { path: ROUTES.COURSES, element: <CoursesPage /> },
      { path: ROUTES.COURSE_DETAIL, element: <CourseDetailPage /> },
      {
        path: ROUTES.PROFILE,
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
    ],
  },
]);
