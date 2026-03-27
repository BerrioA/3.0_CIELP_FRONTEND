import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
const PrivacyPolicyPage = lazy(
  () => import("./features/public/pages/PrivacyPolicyPage"),
);
const TermsOfUsePage = lazy(
  () => import("./features/public/pages/TermsOfUsePage"),
);

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

const APP_NAME = "CIELP";
const GOOGLE_SITE_VERIFICATION =
  import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "";

const SEO_DEFAULT = {
  title: "CIELP | Bienestar docente y analitica institucional",
  description:
    "CIELP ayuda a prevenir y abordar el burnout docente con tamizaje, analitica accionable y seguimiento institucional.",
  robots: "noindex,nofollow",
};

const SEO_ROUTES = [
  {
    match: (pathname) => pathname === "/" || pathname === "/index",
    title: "CIELP | Bienestar docente y prevencion del burnout",
    description:
      "Plataforma de bienestar docente con evaluacion temprana, analitica institucional y acompanamiento para instituciones educativas.",
    robots: "index,follow",
  },
  {
    match: (pathname) => pathname === "/registro-profesor",
    title: "Registro de docentes | CIELP",
    description:
      "Crea tu cuenta en CIELP para iniciar el tamizaje y el seguimiento de bienestar docente.",
    robots: "index,follow",
  },
  {
    match: (pathname) => pathname === "/politica-privacidad",
    title: "Politica de privacidad | CIELP",
    description:
      "Conoce como CIELP trata y protege los datos personales de los usuarios.",
    robots: "index,follow",
  },
  {
    match: (pathname) => pathname === "/terminos-uso",
    title: "Terminos de uso | CIELP",
    description:
      "Consulta las condiciones de acceso y uso de la plataforma CIELP.",
    robots: "index,follow",
  },
  {
    match: (pathname) => pathname === "/login",
    title: "Iniciar sesion | CIELP",
    description: "Accede a tu cuenta institucional en CIELP.",
    robots: "noindex,nofollow",
  },
  {
    match: (pathname) => pathname === "/forgot-password",
    title: "Recuperar contrasena | CIELP",
    description:
      "Solicita el restablecimiento de tu contrasena para acceder a CIELP.",
    robots: "noindex,nofollow",
  },
  {
    match: (pathname) => pathname.startsWith("/reset-password"),
    title: "Restablecer contrasena | CIELP",
    description: "Actualiza tu contrasena de acceso a la plataforma CIELP.",
    robots: "noindex,nofollow",
  },
  {
    match: (pathname) => pathname.startsWith("/verify-account"),
    title: "Verificacion de cuenta | CIELP",
    description: "Confirma tu cuenta para activar el acceso a CIELP.",
    robots: "noindex,nofollow",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard"),
    title: "Panel institucional | CIELP",
    description:
      "Panel de gestion, analitica y seguimiento institucional para bienestar docente.",
    robots: "noindex,nofollow",
  },
];

function ensureMetaTag(key, value, type = "name") {
  const selector =
    type === "property" ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(type, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", value);
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

function GlobalSeo() {
  const location = useLocation();

  useEffect(() => {
    const seo =
      SEO_ROUTES.find((entry) => entry.match(location.pathname)) || SEO_DEFAULT;
    const title = seo.title || SEO_DEFAULT.title;
    const description = seo.description || SEO_DEFAULT.description;
    const robots = seo.robots || SEO_DEFAULT.robots;

    document.title = title;
    document.documentElement.lang = "es-CO";

    ensureMetaTag("description", description);
    ensureMetaTag("robots", robots);
    ensureMetaTag("og:site_name", APP_NAME, "property");
    ensureMetaTag("og:type", "website", "property");
    ensureMetaTag("og:locale", "es_CO", "property");
    ensureMetaTag("og:title", title, "property");
    ensureMetaTag("og:description", description, "property");
    ensureMetaTag("twitter:card", "summary");
    ensureMetaTag("twitter:title", title);
    ensureMetaTag("twitter:description", description);

    if (GOOGLE_SITE_VERIFICATION) {
      ensureMetaTag("google-site-verification", GOOGLE_SITE_VERIFICATION);
    }

    const canonicalUrl = `${window.location.origin}${location.pathname}`;
    setCanonical(canonicalUrl);
  }, [location.pathname]);

  return null;
}

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
          width="142"
          height="142"
          loading="eager"
          fetchPriority="high"
          decoding="async"
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

function DashboardContentLoader() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: { xs: "38dvh", md: "46dvh" },
        width: "100%",
        borderRadius: 1.25,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
      spacing={1}
    >
      <CircularProgress size={24} />
      <Typography
        variant="body2"
        color="text.secondary"
      >
        Cargando modulo...
      </Typography>
    </Stack>
  );
}

function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <GlobalSeo />
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
          path="/politica-privacidad"
          element={
            <Suspense fallback={<RouteLoader />}>
              <PrivacyPolicyPage />
            </Suspense>
          }
        />
        <Route
          path="/terminos-uso"
          element={
            <Suspense fallback={<RouteLoader />}>
              <TermsOfUsePage />
            </Suspense>
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
              <Suspense fallback={<DashboardContentLoader />}>
                <DashboardHomePage />
              </Suspense>
            }
          />
          <Route
            path="mbi"
            element={
              <RoleRoute allowedRoles={ALL_USER_ROLES}>
                <Suspense fallback={<DashboardContentLoader />}>
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
                <Suspense fallback={<DashboardContentLoader />}>
                  <DashboardSpacesPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="espacios/:spaceId/inmersion"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <Suspense fallback={<DashboardContentLoader />}>
                  <DashboardSpaceImmersivePage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="espacios/historial"
            element={
              <RoleRoute
                allowedRoles={[
                  USER_ROLES.SUPER_ADMIN,
                  USER_ROLES.ADMIN,
                  USER_ROLES.PSYCHOLOGIST,
                  USER_ROLES.TEACHER,
                ]}
              >
                <Suspense fallback={<DashboardContentLoader />}>
                  <DashboardSpacesHistoryPage />
                </Suspense>
              </RoleRoute>
            }
          />
          <Route
            path="configuracion"
            element={
              <RoleRoute allowedRoles={ALL_USER_ROLES}>
                <Suspense fallback={<DashboardContentLoader />}>
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
                <Suspense fallback={<DashboardContentLoader />}>
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
                <Suspense fallback={<DashboardContentLoader />}>
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
                <Suspense fallback={<DashboardContentLoader />}>
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
                <Suspense fallback={<DashboardContentLoader />}>
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
