import { useEffect } from "react";
import { useAuthStore } from "../../features/auth/store/auth.store";

function AuthSessionProvider({ children }) {
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
    void hydrateSession();
  }, [bindSessionEvents, hydrateSession]);

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
