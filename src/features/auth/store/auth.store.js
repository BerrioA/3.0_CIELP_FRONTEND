import { create } from "zustand";
import {
  clearStoredAuthStatus,
  clearAccessToken,
  getAccessToken,
  getStoredAuthStatus,
  setStoredAuthStatus,
  setAccessToken,
} from "../../../shared/lib/sessionToken";
import { setAuthSessionHandlers } from "../../../shared/lib/authSessionEvents";
import {
  loginService,
  logoutService,
  profileService,
  resolveAccessTokenFromPayload,
  registerTeacherService,
  requestPasswordRecoveryService,
  resetPasswordService,
  resendVerificationService,
  refreshSessionService,
  verifyAccountService,
} from "../services/auth.service";
import { useDashboardPreferencesStore } from "../../dashboard/store/dashboard-preferences.store";
import { createAutoDismissNotice } from "../../../shared/lib/autoDismissNotice";

const authNoticeDismiss = createAutoDismissNotice(5500);

const initialState = {
  accessToken: null,
  user: null,
  isAuthenticated: getStoredAuthStatus(),
  isLoading: false,
  isRegisteringTeacher: false,
  isBootstrapping: true,
  isHydrating: false,
  hasPendingNetworkRecovery: false,
  authError: null,
  registerTeacherError: null,
  registerTeacherSuccessMessage: null,
  isVerifyingAccount: false,
  verifyAccountStatus: "idle",
  verifyAccountMessage: null,
  lastVerificationCode: null,
  lastVerificationStatus: "idle",
  lastVerificationMessage: null,
  isResendingVerification: false,
  resendVerificationError: null,
  resendVerificationSuccessMessage: null,
  isRequestingPasswordRecovery: false,
  passwordRecoveryError: null,
  passwordRecoverySuccessMessage: null,
  isResettingPassword: false,
  resetPasswordStatus: "idle",
  resetPasswordError: null,
  resetPasswordSuccessMessage: null,
};

const normalizeErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "No fue posible completar la solicitud."
  );
};

export const useAuthStore = create((set, get) => ({
  ...initialState,

  setAuthError: (message) => set({ authError: message || null }),

  markAdditionalInformationCompleted: () =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            has_additional_information: true,
          }
        : state.user,
    })),

  bindSessionEvents: () => {
    setAuthSessionHandlers({
      onTokenRefreshed: (token) => {
        setStoredAuthStatus(true);
        set({
          accessToken: token,
          isAuthenticated: true,
          authError: null,
          hasPendingNetworkRecovery: false,
        });
      },
      onSessionExpired: () => {
        clearAccessToken();
        clearStoredAuthStatus();
        useDashboardPreferencesStore.getState().resetPreferences();
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          hasPendingNetworkRecovery: false,
        });
      },
    });
  },

  hydrateSession: async ({ allowRefresh = true } = {}) => {
    if (get().isHydrating) {
      return;
    }

    set({ isHydrating: true, isBootstrapping: true });

    try {
      if (!allowRefresh) {
        const storedAuthStatus = getStoredAuthStatus();
        const storedToken = getAccessToken();

        if (!storedAuthStatus) {
          clearAccessToken();
          clearStoredAuthStatus();
        }

        set({
          accessToken: storedToken,
          isAuthenticated: storedAuthStatus,
          authError: null,
          hasPendingNetworkRecovery: false,
        });

        return;
      }

      let token = getAccessToken();

      if (token) {
        try {
          const user = await profileService();

          set({
            accessToken: token,
            user,
            isAuthenticated: true,
            authError: null,
            hasPendingNetworkRecovery: false,
          });
          setStoredAuthStatus(true);

          return;
        } catch (profileError) {
          const statusCode = profileError?.response?.status;
          if (statusCode && statusCode !== 401 && statusCode !== 403) {
            throw profileError;
          }

          clearAccessToken();
          clearStoredAuthStatus();
          token = null;
        }
      }

      ({ token } = await refreshSessionService());
      const user = await profileService();

      set({
        accessToken: token,
        user,
        isAuthenticated: true,
        authError: null,
        hasPendingNetworkRecovery: false,
      });
      setStoredAuthStatus(true);
    } catch (error) {
      clearAccessToken();
      clearStoredAuthStatus();
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        hasPendingNetworkRecovery: !error?.response,
      });
    } finally {
      set({ isBootstrapping: false, isHydrating: false });
    }
  },

  retrySessionRecovery: async () => {
    if (get().isHydrating || get().isAuthenticated) {
      return;
    }

    if (!get().hasPendingNetworkRecovery) {
      return;
    }

    set({ isHydrating: true });

    try {
      const { token } = await refreshSessionService();
      const user = await profileService();

      set({
        accessToken: token,
        user,
        isAuthenticated: true,
        authError: null,
        hasPendingNetworkRecovery: false,
      });
      setStoredAuthStatus(true);
    } catch (error) {
      set({
        hasPendingNetworkRecovery: !error?.response,
      });
    } finally {
      set({ isHydrating: false });
    }
  },

  login: async ({ email, password }) => {
    set({
      isLoading: true,
      authError: null,
      registerTeacherSuccessMessage: null,
    });

    try {
      const loginResponse = await loginService({ email, password });
      const loginToken = resolveAccessTokenFromPayload(loginResponse);
      const token = loginToken || (await refreshSessionService()).token;

      setAccessToken(token);

      const user = await profileService();

      set({
        accessToken: token,
        user,
        isAuthenticated: true,
        isLoading: false,
        authError: null,
        hasPendingNetworkRecovery: false,
      });
      setStoredAuthStatus(true);

      return { ok: true };
    } catch (error) {
      clearAccessToken();
      clearStoredAuthStatus();
      const message = normalizeErrorMessage(error);

      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authError: message,
      });

      authNoticeDismiss.schedule(() => {
        set({ authError: null });
      });

      return { ok: false, message };
    }
  },

  registerTeacher: async (userData) => {
    set({
      isRegisteringTeacher: true,
      registerTeacherError: null,
      registerTeacherSuccessMessage: null,
    });

    try {
      const response = await registerTeacherService(userData);
      const message =
        response?.message ||
        "Registro completado. Revise su correo para verificar la cuenta.";

      set({
        isRegisteringTeacher: false,
        registerTeacherError: null,
        registerTeacherSuccessMessage: message,
      });

      authNoticeDismiss.schedule(() => {
        set({
          registerTeacherError: null,
          registerTeacherSuccessMessage: null,
        });
      });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isRegisteringTeacher: false,
        registerTeacherError: message,
        registerTeacherSuccessMessage: null,
      });

      authNoticeDismiss.schedule(() => {
        set({
          registerTeacherError: null,
          registerTeacherSuccessMessage: null,
        });
      });

      return { ok: false, message };
    }
  },

  verifyAccount: async (verificationCode) => {
    const {
      lastVerificationCode,
      lastVerificationStatus,
      lastVerificationMessage,
    } = get();

    if (
      verificationCode &&
      verificationCode === lastVerificationCode &&
      lastVerificationStatus === "success"
    ) {
      set({
        isVerifyingAccount: false,
        verifyAccountStatus: "success",
        verifyAccountMessage:
          lastVerificationMessage || "Su cuenta ha sido verificada con éxito.",
        resendVerificationError: null,
        resendVerificationSuccessMessage: null,
      });

      return {
        ok: true,
        message:
          lastVerificationMessage || "Su cuenta ha sido verificada con éxito.",
      };
    }

    set({
      isVerifyingAccount: true,
      verifyAccountStatus: "loading",
      verifyAccountMessage: null,
      resendVerificationError: null,
      resendVerificationSuccessMessage: null,
    });

    try {
      const response = await verifyAccountService(verificationCode);
      const message =
        response?.message || "Su cuenta ha sido verificada con éxito.";

      set({
        isVerifyingAccount: false,
        verifyAccountStatus: "success",
        verifyAccountMessage: message,
        lastVerificationCode: verificationCode,
        lastVerificationStatus: "success",
        lastVerificationMessage: message,
      });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isVerifyingAccount: false,
        verifyAccountStatus: "error",
        verifyAccountMessage: message,
        lastVerificationCode: verificationCode,
        lastVerificationStatus: "error",
        lastVerificationMessage: message,
      });

      authNoticeDismiss.schedule(() => {
        set({ verifyAccountMessage: null });
      });

      return { ok: false, message };
    }
  },

  resendVerification: async (email) => {
    set({
      isResendingVerification: true,
      resendVerificationError: null,
      resendVerificationSuccessMessage: null,
    });

    try {
      const response = await resendVerificationService(email);
      const message =
        response?.message || "Le enviamos un nuevo correo de verificación.";

      set({
        isResendingVerification: false,
        resendVerificationError: null,
        resendVerificationSuccessMessage: message,
      });

      authNoticeDismiss.schedule(() => {
        set({
          resendVerificationError: null,
          resendVerificationSuccessMessage: null,
        });
      });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isResendingVerification: false,
        resendVerificationError: message,
        resendVerificationSuccessMessage: null,
      });

      authNoticeDismiss.schedule(() => {
        set({
          resendVerificationError: null,
          resendVerificationSuccessMessage: null,
        });
      });

      return { ok: false, message };
    }
  },

  resetVerificationFlow: () =>
    set({
      isVerifyingAccount: false,
      verifyAccountStatus: "idle",
      verifyAccountMessage: null,
      isResendingVerification: false,
      resendVerificationError: null,
      resendVerificationSuccessMessage: null,
    }),

  requestPasswordRecovery: async (email) => {
    set({
      isRequestingPasswordRecovery: true,
      passwordRecoveryError: null,
      passwordRecoverySuccessMessage: null,
    });

    try {
      const response = await requestPasswordRecoveryService(email);
      const message =
        response?.message ||
        "Enlace de recuperación enviado con éxito. Revise su correo.";

      set({
        isRequestingPasswordRecovery: false,
        passwordRecoveryError: null,
        passwordRecoverySuccessMessage: message,
      });

      authNoticeDismiss.schedule(() => {
        set({
          passwordRecoveryError: null,
          passwordRecoverySuccessMessage: null,
        });
      });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isRequestingPasswordRecovery: false,
        passwordRecoveryError: message,
        passwordRecoverySuccessMessage: null,
      });

      authNoticeDismiss.schedule(() => {
        set({
          passwordRecoveryError: null,
          passwordRecoverySuccessMessage: null,
        });
      });

      return { ok: false, message };
    }
  },

  resetPasswordWithCode: async ({ verificationCode, newPassword }) => {
    set({
      isResettingPassword: true,
      resetPasswordStatus: "loading",
      resetPasswordError: null,
      resetPasswordSuccessMessage: null,
    });

    try {
      const response = await resetPasswordService({
        verificationCode,
        newPassword,
      });

      const message = response?.message || "Contraseña restablecida con éxito.";

      set({
        isResettingPassword: false,
        resetPasswordStatus: "success",
        resetPasswordError: null,
        resetPasswordSuccessMessage: message,
      });

      authNoticeDismiss.schedule(() => {
        set({ resetPasswordError: null, resetPasswordSuccessMessage: null });
      });

      return { ok: true, message };
    } catch (error) {
      const message = normalizeErrorMessage(error);

      set({
        isResettingPassword: false,
        resetPasswordStatus: "error",
        resetPasswordError: message,
        resetPasswordSuccessMessage: null,
      });

      authNoticeDismiss.schedule(() => {
        set({ resetPasswordError: null, resetPasswordSuccessMessage: null });
      });

      return { ok: false, message };
    }
  },

  resetPasswordRecoveryFlow: () =>
    set({
      isRequestingPasswordRecovery: false,
      passwordRecoveryError: null,
      passwordRecoverySuccessMessage: null,
      isResettingPassword: false,
      resetPasswordStatus: "idle",
      resetPasswordError: null,
      resetPasswordSuccessMessage: null,
    }),

  logout: async () => {
    try {
      await logoutService();
    } finally {
      clearAccessToken();
      clearStoredAuthStatus();
      useDashboardPreferencesStore.getState().resetPreferences();
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
        authError: null,
        hasPendingNetworkRecovery: false,
      });
    }
  },
}));
