import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/auth.store";

const isPublicPath = (pathname) => {
  if (!pathname) {
    return false;
  }

  if (pathname === "/" || pathname === "/index") {
    return true;
  }

  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro-profesor") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-account")
  );
};

function AuthSessionProvider({ children }) {
  const { pathname } = useLocation();
  const bindSessionEvents = useAuthStore((state) => state.bindSessionEvents);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const retrySessionRecovery = useAuthStore(
    (state) => state.retrySessionRecovery,
  );
  const hasPendingNetworkRecovery = useAuthStore(
    (state) => state.hasPendingNetworkRecovery,
  );

  useEffect(() => {
    bindSessionEvents();
  }, [bindSessionEvents]);

  useEffect(() => {
    const allowRefresh = !isPublicPath(pathname);
    void hydrateSession({ allowRefresh });
  }, [hydrateSession, pathname]);

  useEffect(() => {
    if (!hasPendingNetworkRecovery) {
      return undefined;
    }

    const handleOnline = () => {
      void retrySessionRecovery();
    };

    window.addEventListener("online", handleOnline);
    const intervalId = window.setInterval(() => {
      void retrySessionRecovery();
    }, 6000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.clearInterval(intervalId);
    };
  }, [hasPendingNetworkRecovery, retrySessionRecovery]);

  return children;
}

export default AuthSessionProvider;
