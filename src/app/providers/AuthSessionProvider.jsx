import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { subscribeAuthSessionEvents } from "../../shared/lib/authSessionEvents";

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
  const hasHydratedOnceRef = useRef(false);
  const bindSessionEvents = useAuthStore((state) => state.bindSessionEvents);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const retrySessionRecovery = useAuthStore(
    (state) => state.retrySessionRecovery,
  );
  const hasPendingNetworkRecovery = useAuthStore(
    (state) => state.hasPendingNetworkRecovery,
  );

  useEffect(() => {
    bindSessionEvents();

    const unsubscribe = subscribeAuthSessionEvents();

    return () => {
      unsubscribe();
    };
  }, [bindSessionEvents]);

  useEffect(() => {
    const currentPathIsPublic = isPublicPath(pathname);

    if (!hasHydratedOnceRef.current) {
      hasHydratedOnceRef.current = true;
      void hydrateSession({ allowRefresh: !currentPathIsPublic });
      return;
    }

    if (!currentPathIsPublic && !isAuthenticated && !isHydrating) {
      void hydrateSession({ allowRefresh: true });
    }
  }, [hydrateSession, isAuthenticated, isHydrating, pathname]);

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
