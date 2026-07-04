import { Outlet, createBrowserRouter } from "react-router-dom";
import { AuthBootstrap, ProtectedRoute } from "@/features/auth";
import { ROUTES } from "@/api/endpoints";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Top-level router. <AuthBootstrap> runs the refresh-on-boot query and gates
 * visible content while the session is being restored. Public routes are
 * reachable without a session; only /auth/profile is behind <ProtectedRoute>.
 *
 * The route order matters: put `/auth/*` before `*` so the catch-all 404
 * doesn't shadow them.
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
