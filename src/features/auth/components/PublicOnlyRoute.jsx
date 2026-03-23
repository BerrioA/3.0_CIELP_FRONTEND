import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

function PublicOnlyRoute({ children, redirectTo = "/dashboard" }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
