import { Box, Stack, Typography } from "@mui/material";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import PublicOnlyRoute from "./features/auth/components/PublicOnlyRoute";
import RoleRoute from "./features/auth/components/RoleRoute";
import { ALL_USER_ROLES, USER_ROLES } from "./features/dashboard/config/roles";
import RouteErrorBoundary from "./app/components/RouteErrorBoundary";

const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const RegisterTeacherPage = lazy(
  () => import("./features/auth/pages/RegisterTeacherPage"),
);
const ForgotPasswordPage = lazy(
  () => import("./features/auth/pages/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(
  () => import("./features/auth/pages/ResetPasswordPage"),
);
const VerifyAccountPage = lazy(
  () => import("./features/auth/pages/VerifyAccountPage"),
);
const LandingPage = lazy(() => import("./features/public/pages/LandingPage"));

const DashboardShell = lazy(
  () => import("./features/dashboard/layouts/DashboardShell"),
);
const DashboardHomePage = lazy(
  () => import("./features/dashboard/pages/DashboardHomePage"),
);
const DashboardProfilePage = lazy(
  () => import("./features/dashboard/pages/DashboardProfilePage"),
);
const DashboardSpacesPage = lazy(
  () => import("./features/dashboard/pages/DashboardSpacesPage"),
);
const DashboardSpaceImmersivePage = lazy(
  () => import("./features/dashboard/pages/DashboardSpaceImmersivePage"),
);
const DashboardSpacesHistoryPage = lazy(
  () => import("./features/dashboard/pages/DashboardSpacesHistoryPage"),
);
const DashboardUsersManagementPage = lazy(
  () => import("./features/dashboard/pages/DashboardUsersManagementPage"),
);
const DashboardUsersTrashPage = lazy(
  () => import("./features/dashboard/pages/DashboardUsersTrashPage"),
);
const DashboardTeachersPage = lazy(
  () => import("./features/dashboard/pages/DashboardTeachersPage"),
);
const DashboardGlobalAnalyticsPage = lazy(
  () => import("./features/dashboard/pages/DashboardGlobalAnalyticsPage"),
);
const DashboardMbiPage = lazy(
  () => import("./features/dashboard/pages/DashboardMbiPage"),
);

function RouteLoader() {
  return (
    <Stack
      minHeight="100dvh"
      alignItems="center"
      justifyContent="center"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1700,
        background:
          "radial-gradient(circle at 12% 12%, rgba(13,127,126,0.16), transparent 36%), radial-gradient(circle at 88% 88%, rgba(229,147,57,0.14), transparent 42%), #f4f8f7",
      }}
    >
      <Stack
        spacing={1.4}
        alignItems="center"
      >
        <Box
          component="img"
          src="/CIELP.png"
          alt="CIELP"
          sx={{
            width: { xs: 118, md: 142 },
            height: "auto",
            filter: "drop-shadow(0 8px 22px rgba(11, 80, 94, 0.2))",
            animation: "cielp-loader-float 1.45s ease-in-out infinite",
            "@keyframes cielp-loader-float": {
              "0%, 100%": { transform: "translateY(0px) scale(1)" },
              "50%": { transform: "translateY(-4px) scale(1.03)" },
            },
          }}
        />

        <Box
          sx={{
            width: 148,
            height: 4,
            borderRadius: 999,
            overflow: "hidden",
            bgcolor: "rgba(17, 79, 95, 0.13)",
          }}
        >
          <Box
            sx={{
              width: "45%",
              height: "100%",
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(11,110,110,0.9), rgba(233,161,69,0.95))",
              animation: "cielp-loader-progress 1.35s ease-in-out infinite",
              "@keyframes cielp-loader-progress": {
                "0%": { transform: "translateX(-100%)" },
                "100%": { transform: "translateX(240%)" },
              },
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{ color: "#114f5f", fontWeight: 600 }}
        >
          Cargando experiencia CIELP...
        </Typography>
      </Stack>
    </Stack>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/index"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/registro-profesor"
          element={
            <PublicOnlyRoute>
              <RegisterTeacherPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password/:verificationCode"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/verify-account/:code"
          element={
            <PublicOnlyRoute>
              <VerifyAccountPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/verify-account"
          element={
            <PublicOnlyRoute>
              <VerifyAccountPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RouteErrorBoundary>
              <ProtectedRoute>
                <Suspense fallback={<RouteLoader />}>
                  <DashboardShell />
                </Suspense>
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<RouteLoader />}>
                <DashboardHomePage />
              </Suspense>
            }
          />
          <Route
            path="mbi"
            element={
              <RoleRoute allowedRoles={ALL_USER_ROLES}>
                <Suspense fallback={<RouteLoader />}>
                  <DashboardMbiPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="espacios"
            element={
              <RoleRoute
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.ADMIN,
                  USER_ROLES.TEACHER,
                  USER_ROLES.DEVELOPER,
                ]}
              >
                <Suspense fallback={<RouteLoader />}>
                  <DashboardSpacesPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="espacios/:spaceId/inmersion"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <Suspense fallback={<RouteLoader />}>
                  <DashboardSpaceImmersivePage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="espacios/historial"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <Suspense fallback={<RouteLoader />}>
                  <DashboardSpacesHistoryPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="configuracion"
            element={
              <RoleRoute allowedRoles={ALL_USER_ROLES}>
                <Suspense fallback={<RouteLoader />}>
                  <DashboardProfilePage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="perfil"
            element={
              <Navigate
                to="/dashboard/configuracion"
                replace
              />
            }
          />
          <Route
            path="analytics-global"
            element={
              <RoleRoute
                allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}
              >
                <Suspense fallback={<RouteLoader />}>
                  <DashboardGlobalAnalyticsPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <RoleRoute
                allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}
              >
                <Suspense fallback={<RouteLoader />}>
                  <DashboardUsersManagementPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="usuarios/papelera"
            element={
              <RoleRoute
                allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN]}
              >
                <Suspense fallback={<RouteLoader />}>
                  <DashboardUsersTrashPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="docentes"
            element={
              <RoleRoute
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.ADMIN,
                  USER_ROLES.PSYCHOLOGIST,
                ]}
              >
                <Suspense fallback={<RouteLoader />}>
                  <DashboardTeachersPage />
                </Suspense>
              </RoleRoute>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
