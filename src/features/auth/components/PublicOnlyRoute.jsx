import { CircularProgress, Stack } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

function PublicOnlyRoute({ children, redirectTo = "/dashboard" }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

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

  if (isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return children;
}

export default PublicOnlyRoute;
