import { CircularProgress, Stack } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return (
      <Stack minHeight="100dvh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
