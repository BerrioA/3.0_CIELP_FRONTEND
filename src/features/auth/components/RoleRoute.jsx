import { CircularProgress, Stack } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

function RoleRoute({ allowedRoles, children, fallbackPath = "/dashboard" }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const userRole = useAuthStore((state) => state.user?.role);

  if (isBootstrapping) {
    return (
      <Stack
        minHeight="100dvh"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <Navigate
        to={fallbackPath}
        replace
      />
    );
  }

  return children;
}

export default RoleRoute;
